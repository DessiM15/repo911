import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminLeadUpdateSchema } from '@/lib/validations/admin';
import { sendStatusUpdateSms } from '@/lib/sms';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return apiError('Forbidden', 403);
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return apiError('Lead not found', 404);
    }

    // Get claiming attorney info if claimed
    let attorney = null;
    if (lead.claimed_by) {
      const { data: atty } = await supabase
        .from('attorneys')
        .select('id, first_name, last_name, email, firm_name')
        .eq('id', lead.claimed_by)
        .single();
      attorney = atty;
    }

    // Get transaction for this lead
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return apiSuccess({ lead, attorney, transaction });
  } catch (error) {
    console.error('Admin lead detail error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id, email, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return apiError('Forbidden', 403);
    }

    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return apiError('Insufficient permissions', 403);
    }

    const body = await request.json();

    const parsed = adminLeadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const updates: Record<string, unknown> = { ...parsed.data };

    // Fetch old values before update
    const { data: oldLead } = await supabase
      .from('leads')
      .select('status, qualification_tier')
      .eq('id', id)
      .single();

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id);

    if (error) {
      return apiError('Failed to update lead', 500);
    }

    // Insert audit log entry (fire-and-forget)
    if (oldLead) {
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};
      for (const field of Object.keys(updates)) {
        if (field === 'updated_at') continue;
        if (updates[field] !== (oldLead as Record<string, unknown>)[field]) {
          oldValues[field] = (oldLead as Record<string, unknown>)[field];
          newValues[field] = updates[field];
        }
      }
      if (Object.keys(newValues).length > 0) {
        supabase.from('admin_audit_log').insert({
          admin_id: admin.id,
          admin_email: admin.email,
          action: 'update_lead',
          entity_type: 'lead',
          entity_id: id,
          old_values: oldValues,
          new_values: newValues,
          ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
        }).then(() => {});
      }
    }

    // SMS to consumer on status change (fire-and-forget)
    if (parsed.data.status && oldLead && parsed.data.status !== oldLead.status) {
      supabase
        .from('leads')
        .select('phone, preferred_contact, sms_notifications')
        .eq('id', id)
        .single()
        .then(({ data: leadData }) => {
          if (leadData) {
            sendStatusUpdateSms(
              { phone: leadData.phone, preferred_contact: leadData.preferred_contact, sms_notifications: leadData.sms_notifications },
              id,
              parsed.data.status!
            ).catch(() => { /* non-critical */ });
          }
        });
    }

    // Log status_change activities (fire-and-forget)
    if (oldLead) {
      const changes: { field: string; old_value: string; new_value: string }[] = [];
      if (parsed.data.status && parsed.data.status !== oldLead.status) {
        changes.push({ field: 'status', old_value: oldLead.status, new_value: parsed.data.status });
      }
      if (parsed.data.qualification_tier && parsed.data.qualification_tier !== oldLead.qualification_tier) {
        changes.push({ field: 'qualification_tier', old_value: oldLead.qualification_tier, new_value: parsed.data.qualification_tier });
      }

      if (changes.length > 0) {
        supabase
          .from('crm_contacts')
          .select('id')
          .eq('source_lead_id', id)
          .single()
          .then(({ data: contact }) => {
            if (contact) {
              const activities = changes.map((c) => ({
                contact_id: contact.id,
                activity_type: 'status_change' as const,
                description: c.field === 'status'
                  ? `Lead status changed from ${c.old_value} to ${c.new_value}`
                  : `Qualification tier changed from ${c.old_value} to ${c.new_value}`,
                performed_by: admin.id,
                metadata: c,
              }));
              supabase.from('crm_activities').insert(activities).then(() => {});
            }
          });
      }
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Admin lead update error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
