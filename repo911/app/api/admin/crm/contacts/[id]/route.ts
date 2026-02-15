import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmContactUpdateSchema } from '@/lib/validations/admin';
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

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contact) {
      return apiError('Contact not found', 404);
    }

    // Get activities
    const { data: activities } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false });

    // Get associated lead/attorney
    let lead = null;
    let attorney = null;
    if (contact.source_lead_id) {
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, status, qualification_tier, qualification_score')
        .eq('id', contact.source_lead_id)
        .single();
      lead = data;
    }
    if (contact.source_attorney_id) {
      const { data } = await supabase
        .from('attorneys')
        .select('id, first_name, last_name, status, firm_name')
        .eq('id', contact.source_attorney_id)
        .single();
      attorney = data;
    }

    return apiSuccess({
      contact,
      activities: activities || [],
      lead,
      attorney,
    });
  } catch (error) {
    console.error('CRM contact detail error:', error);
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
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return apiError('Forbidden', 403);
    }

    const body = await request.json();

    const parsed = crmContactUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { add_note, lifecycle_stage, tags, next_follow_up } = parsed.data;

    // Handle adding a note
    if (add_note) {
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('notes')
        .eq('id', id)
        .single();

      const currentNotes = contact?.notes || [];
      const newNote = {
        timestamp: new Date().toISOString(),
        author: 'Admin',
        note_text: add_note,
      };

      await supabase
        .from('crm_contacts')
        .update({
          notes: [...currentNotes, newNote],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Log activity
      await supabase.from('crm_activities').insert({
        contact_id: id,
        activity_type: 'note',
        description: add_note,
        performed_by: admin.id,
      });

      return apiSuccess({ success: true });
    }

    // Handle field updates
    const updates: Record<string, unknown> = {};
    if (lifecycle_stage !== undefined) updates.lifecycle_stage = lifecycle_stage;
    if (tags !== undefined) updates.tags = tags;
    if (next_follow_up !== undefined) updates.next_follow_up = next_follow_up;

    if (Object.keys(updates).length === 0) {
      return apiError('No valid fields to update', 400);
    }

    // Fetch old lifecycle_stage before update
    let oldLifecycleStage: string | null = null;
    if (lifecycle_stage) {
      const { data: oldContact } = await supabase
        .from('crm_contacts')
        .select('lifecycle_stage')
        .eq('id', id)
        .single();
      oldLifecycleStage = oldContact?.lifecycle_stage ?? null;
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .eq('id', id);

    if (error) {
      return apiError('Failed to update contact', 500);
    }

    // Log status_change activity if lifecycle_stage changed (fire-and-forget)
    if (lifecycle_stage && oldLifecycleStage !== null && oldLifecycleStage !== lifecycle_stage) {
      supabase.from('crm_activities').insert({
        contact_id: id,
        activity_type: 'status_change',
        description: `Lifecycle stage changed from ${oldLifecycleStage} to ${lifecycle_stage}`,
        performed_by: admin.id,
        metadata: { field: 'lifecycle_stage', old_value: oldLifecycleStage, new_value: lifecycle_stage },
      }).then(() => {});
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('CRM contact update error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
