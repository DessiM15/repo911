import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .single();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

    return NextResponse.json({ occurrences: occurrences || [] });
  }

  // Build errors list query
  let query = adminSupabase
    .from('errors')
    .select('*', { count: 'exact' });

  if (status && status !== 'all') query = query.eq('status', status);
  if (level && level !== 'all') query = query.eq('level', level);
  if (search) {
    query = query.or(`message.ilike.%${search}%,error_type.ilike.%${search}%`);
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

  return NextResponse.json({
    errors: errors || [],
    total: count || 0,
    stats: {
      total: totalCount || 0,
      unresolved: unresolvedCount || 0,
    },
    page,
    limit,
  });
}

export async function PATCH(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('supabase_auth_id', user.id)
    .single();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, status } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const validStatuses = ['unresolved', 'resolved', 'ignored', 'muted'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('errors')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
