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

    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: transactions } = await query;

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

    // Stats
    const allTx = transactions || [];
    const total_revenue = allTx
      .filter((t) => t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);
    const total_refunded = allTx
      .filter((t) => t.status === 'refunded')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions: allTx,
      attorneys,
      total_revenue,
      total_refunded,
      total_count: allTx.length,
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
