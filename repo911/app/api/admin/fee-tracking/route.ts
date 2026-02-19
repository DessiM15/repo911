import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { feeTrackingUpdateSchema } from '@/lib/validations/admin';
import { apiSuccess, apiError } from '@/lib/api-response';
import { sanitizeSearchParam, isValidUUID } from '@/lib/sanitize';

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
    const caseStatus = searchParams.get('case_status');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    // If searching, find matching attorney IDs first
    const s = search ? sanitizeSearchParam(search) : '';
    let matchingAttorneyIds: string[] | null = null;
    if (s) {
      const { data: matchedAttorneys } = await supabase
        .from('attorneys')
        .select('id')
        .or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%`);
      matchingAttorneyIds = (matchedAttorneys || []).map((a) => a.id).filter(isValidUUID);
    }

    let query = supabase
      .from('fee_tracking')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (caseStatus) query = query.eq('case_status', caseStatus);

    if (s) {
      if (matchingAttorneyIds && matchingAttorneyIds.length > 0) {
        query = query.or(`notes.ilike.%${s}%,attorney_id.in.(${matchingAttorneyIds.join(',')})`);
      } else {
        query = query.ilike('notes', `%${s}%`);
      }
    }

    query = query.range(offset, offset + limit - 1);

    const { data: fees, count } = await query;

    // Get attorney names
    const attorneyIds = [...new Set((fees || []).map((f) => f.attorney_id).filter(Boolean))];
    let attorneys: Record<string, string> = {};
    if (attorneyIds.length > 0) {
      const { data: attyData } = await supabase
        .from('attorneys')
        .select('id, first_name, last_name')
        .in('id', attorneyIds);
      attorneys = (attyData || []).reduce((acc, a) => {
        acc[a.id] = `${a.first_name} ${a.last_name}`;
        return acc;
      }, {} as Record<string, string>);
    }

    const total = count || 0;

    return apiSuccess({
      fees: fees || [],
      attorneys,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Fee tracking error:', error);
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
      .select('id, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return apiError('Forbidden', 403);
    }

    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return apiError('Insufficient permissions', 403);
    }

    const body = await request.json();

    const parsed = feeTrackingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { fee_id, ...updateFields } = parsed.data;

    // Verify fee record exists and fetch old values
    const { data: existingFee } = await supabase
      .from('fee_tracking')
      .select('id, case_status, lead_id')
      .eq('id', fee_id)
      .single();

    if (!existingFee) {
      return apiError('Fee record not found', 404);
    }

    const cleanUpdates: Record<string, unknown> = {};
    if (updateFields.case_status !== undefined) cleanUpdates.case_status = updateFields.case_status;
    if (updateFields.attorney_total_fee !== undefined) cleanUpdates.attorney_total_fee = updateFields.attorney_total_fee;
    if (updateFields.notes !== undefined) cleanUpdates.notes = updateFields.notes;

    if (Object.keys(cleanUpdates).length === 0) {
      return apiError('No valid fields', 400);
    }

    const { error } = await supabase
      .from('fee_tracking')
      .update(cleanUpdates)
      .eq('id', fee_id);

    if (error) {
      return apiError('Failed to update', 500);
    }

    // Log status_change activity if case_status changed (fire-and-forget)
    if (updateFields.case_status && existingFee.case_status !== updateFields.case_status && existingFee.lead_id) {
      supabase
        .from('crm_contacts')
        .select('id')
        .eq('source_lead_id', existingFee.lead_id)
        .single()
        .then(({ data: contact }) => {
          if (contact) {
            supabase.from('crm_activities').insert({
              contact_id: contact.id,
              activity_type: 'status_change',
              description: `Case status changed from ${existingFee.case_status} to ${updateFields.case_status}`,
              performed_by: admin.id,
              metadata: { field: 'case_status', old_value: existingFee.case_status, new_value: updateFields.case_status },
            }).then(() => {});
          }
        });
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Fee tracking update error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
