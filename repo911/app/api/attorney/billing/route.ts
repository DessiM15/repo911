import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 });
    }

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('attorney_id', attorney.id)
      .order('created_at', { ascending: false });

    const txList = transactions || [];
    const total_spent = txList
      .filter((t) => t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);

    const total_leads = txList.filter((t) => t.status === 'succeeded').length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const this_month = txList
      .filter((t) => t.status === 'succeeded' && t.created_at >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions: txList,
      stats: { total_spent, total_leads, this_month },
    });
  } catch (error) {
    console.error('Billing error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
