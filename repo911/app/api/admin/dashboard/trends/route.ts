import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // 1. Leads over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentLeads } = await supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const leadsByDate: Record<string, number> = {};
    // Pre-fill all 30 days with zero
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 29 + i);
      leadsByDate[d.toISOString().split('T')[0]] = 0;
    }
    for (const lead of recentLeads || []) {
      const date = lead.created_at.split('T')[0];
      if (leadsByDate[date] !== undefined) {
        leadsByDate[date]++;
      }
    }
    const leads_over_time = Object.entries(leadsByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // 2. Conversion funnel
    const { count: totalCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    const { count: qualifiedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['qualified_hot', 'qualified_warm', 'qualified_cold', 'claimed']);

    const { count: claimedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'claimed');

    const conversion_funnel = [
      { stage: 'Total Leads', count: totalCount || 0 },
      { stage: 'Qualified', count: qualifiedCount || 0 },
      { stage: 'Claimed', count: claimedCount || 0 },
    ];

    // 3. Revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data: revenueTransactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('status', 'succeeded')
      .gte('created_at', sixMonthsAgo.toISOString());

    const revenueByMonth: Record<string, number> = {};
    // Pre-fill last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
    }
    for (const tx of revenueTransactions || []) {
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (revenueByMonth[key] !== undefined) {
        revenueByMonth[key] += tx.amount;
      }
    }
    const revenue_trend = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    return NextResponse.json({
      leads_over_time,
      conversion_funnel,
      revenue_trend,
    });
  } catch (error) {
    console.error('Dashboard trends error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
