import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pipelineUpdateSchema } from '@/lib/validations/admin';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const { data: leads, count } = await supabase
      .from('leads')
      .select('id, first_name, last_name, status, qualification_tier, qualification_score, repo_state, created_at, claimed_at, claimed_by', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return apiSuccess({
      leads: leads || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
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

    const parsed = pipelineUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { lead_id, status } = parsed.data;

    // Fetch old status before update
    const { data: oldLead } = await supabase
      .from('leads')
      .select('status')
      .eq('id', lead_id)
      .single();

    const { error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', lead_id);

    if (error) {
      return apiError('Failed to update status', 500);
    }

    // Log status_change activity (fire-and-forget)
    if (oldLead && oldLead.status !== status) {
      supabase
        .from('crm_contacts')
        .select('id')
        .eq('source_lead_id', lead_id)
        .single()
        .then(({ data: contact }) => {
          if (contact) {
            supabase.from('crm_activities').insert({
              contact_id: contact.id,
              activity_type: 'status_change',
              description: `Lead status changed from ${oldLead.status} to ${status}`,
              performed_by: admin.id,
              metadata: { field: 'status', old_value: oldLead.status, new_value: status },
            }).then(() => {});
          }
        });
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Pipeline update error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
