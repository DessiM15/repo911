import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
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
    const tier = searchParams.get('tier');
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, status, qualification_tier, qualification_score, repo_state, repo_date, lender_name, claimed_by, claimed_at, created_at', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (tier) query = query.eq('qualification_tier', tier);
    if (state) query = query.eq('repo_state', state);
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.order(sort, { ascending: order === 'asc' }).range(offset, offset + limit - 1);

    const { data: leads, count } = await query;

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin leads error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
