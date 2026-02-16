import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeSearchParam, isValidUUID } from '@/lib/sanitize';

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

    // Build main query
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    if (s) {
      if (matchingAttorneyIds && matchingAttorneyIds.length > 0) {
        query = query.or(`stripe_payment_intent_id.ilike.%${s}%,attorney_id.in.(${matchingAttorneyIds.join(',')})`);
      } else {
        query = query.ilike('stripe_payment_intent_id', `%${s}%`);
      }
    }

    // Stats query (same filters, no pagination)
    let statsQuery = supabase
      .from('transactions')
      .select('amount, status');

    if (status) statsQuery = statsQuery.eq('status', status);

    if (s) {
      if (matchingAttorneyIds && matchingAttorneyIds.length > 0) {
        statsQuery = statsQuery.or(`stripe_payment_intent_id.ilike.%${s}%,attorney_id.in.(${matchingAttorneyIds.join(',')})`);
      } else {
        statsQuery = statsQuery.ilike('stripe_payment_intent_id', `%${s}%`);
      }
    }

    const { data: statsData } = await statsQuery;

    // Paginate main query
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, count } = await query;

    // Get attorney names for display
    const attorneyIds = [...new Set((transactions || []).map((t) => t.attorney_id).filter(Boolean))];
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

    // Stats from unfiltered-by-pagination data
    const allStats = statsData || [];
    const total_revenue = allStats
      .filter((t) => t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);
    const total_refunded = allStats
      .filter((t) => t.status === 'refunded')
      .reduce((sum, t) => sum + t.amount, 0);

    const total = count || 0;

    return NextResponse.json({
      transactions: transactions || [],
      attorneys,
      total_revenue,
      total_refunded,
      total_count: total,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
