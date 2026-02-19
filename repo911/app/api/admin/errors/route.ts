import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { errorStatusUpdateSchema } from '@/lib/validations/admin';
import { apiSuccess, apiError } from '@/lib/api-response';
import { sanitizeSearchParam } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  // Auth check
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

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const errorId = searchParams.get('errorId'); // For occurrence drill-down
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    const adminSupabase = createAdminClient();

    // If requesting occurrences for a specific error
    if (errorId) {
      const { data: occurrences } = await adminSupabase
        .from('error_occurrences')
        .select('*')
        .eq('error_id', errorId)
        .order('created_at', { ascending: false })
        .limit(20);

      return apiSuccess({ occurrences: occurrences || [] });
    }

    // Build errors list query
    let query = adminSupabase
      .from('errors')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (level && level !== 'all') query = query.eq('level', level);
    if (search) {
      const s = sanitizeSearchParam(search);
      query = query.or(`message.ilike.%${s}%,error_type.ilike.%${s}%`);
    }

    query = query.order('last_seen', { ascending: false }).range(offset, offset + limit - 1);

    const { data: errors, count } = await query;

    // Stats
    const { count: unresolvedCount } = await adminSupabase
      .from('errors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unresolved');

    const { count: totalCount } = await adminSupabase
      .from('errors')
      .select('id', { count: 'exact', head: true });

    return apiSuccess({
      errors: errors || [],
      total: count || 0,
      stats: {
        total: totalCount || 0,
        unresolved: unresolvedCount || 0,
      },
      page,
      limit,
    });
  } catch (err) {
    console.error('Admin errors GET failed:', err);
    return apiError('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  // Auth check
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

  try {
    const body = await request.json();

    const parsed = errorStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { id, status } = parsed.data;

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('errors')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating error status:', error.message);
      return apiError('Failed to update error status', 500);
    }

    return apiSuccess({ success: true });
  } catch (err) {
    console.error('Admin errors PATCH failed:', err);
    return apiError('Internal server error', 500);
  }
}
