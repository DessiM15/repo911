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

    // Parse optional date range params
    const { searchParams } = request.nextUrl;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (fromParam || toParam) {
      if (fromParam) {
        fromDate = new Date(fromParam + 'T00:00:00');
        if (isNaN(fromDate.getTime())) {
          return NextResponse.json({ error: 'Invalid "from" date' }, { status: 400 });
        }
      }
      if (toParam) {
        toDate = new Date(toParam + 'T23:59:59.999');
        if (isNaN(toDate.getTime())) {
          return NextResponse.json({ error: 'Invalid "to" date' }, { status: 400 });
        }
      }
      if (fromDate && toDate && fromDate > toDate) {
        return NextResponse.json({ error: '"from" must be before "to"' }, { status: 400 });
      }
    }

    // Determine the effective date range
    const now = new Date();
    const effectiveFrom = fromDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })();
    const effectiveTo = toDate || now;

    // Calculate range span in days for bucketing
    const rangeDays = Math.ceil((effectiveTo.getTime() - effectiveFrom.getTime()) / (1000 * 60 * 60 * 24));
    const useMonthlyBuckets = rangeDays > 90;

    // 1. Leads over time
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', effectiveFrom.toISOString())
      .lte('created_at', effectiveTo.toISOString())
      .order('created_at', { ascending: true });

    let leads_over_time: { date: string; count: number }[];

    if (useMonthlyBuckets) {
      const leadsByMonth: Record<string, number> = {};
      // Pre-fill all months in range
      const cursor = new Date(effectiveFrom.getFullYear(), effectiveFrom.getMonth(), 1);
      const endMonth = new Date(effectiveTo.getFullYear(), effectiveTo.getMonth(), 1);
      while (cursor <= endMonth) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        leadsByMonth[key] = 0;
        cursor.setMonth(cursor.getMonth() + 1);
      }
      for (const lead of recentLeads || []) {
        const d = new Date(lead.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (leadsByMonth[key] !== undefined) {
          leadsByMonth[key]++;
        }
      }
      leads_over_time = Object.entries(leadsByMonth).map(([date, count]) => ({ date, count }));
    } else {
      const leadsByDate: Record<string, number> = {};
      // Pre-fill all days in range
      for (let i = 0; i <= rangeDays; i++) {
        const d = new Date(effectiveFrom);
        d.setDate(d.getDate() + i);
        leadsByDate[d.toISOString().split('T')[0]] = 0;
      }
      for (const lead of recentLeads || []) {
        const date = lead.created_at.split('T')[0];
        if (leadsByDate[date] !== undefined) {
          leadsByDate[date]++;
        }
      }
      leads_over_time = Object.entries(leadsByDate).map(([date, count]) => ({ date, count }));
    }

    // 2. Conversion funnel (scoped to date range)
    let totalQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    let qualifiedQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['qualified_hot', 'qualified_warm', 'qualified_cold', 'claimed']);
    let claimedQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'claimed');

    if (fromParam || toParam) {
      totalQuery = totalQuery
        .gte('created_at', effectiveFrom.toISOString())
        .lte('created_at', effectiveTo.toISOString());
      qualifiedQuery = qualifiedQuery
        .gte('created_at', effectiveFrom.toISOString())
        .lte('created_at', effectiveTo.toISOString());
      claimedQuery = claimedQuery
        .gte('created_at', effectiveFrom.toISOString())
        .lte('created_at', effectiveTo.toISOString());
    }

    const [
      { count: totalCount },
      { count: qualifiedCount },
      { count: claimedCount },
    ] = await Promise.all([totalQuery, qualifiedQuery, claimedQuery]);

    const conversion_funnel = [
      { stage: 'Total Leads', count: totalCount || 0 },
      { stage: 'Qualified', count: qualifiedCount || 0 },
      { stage: 'Claimed', count: claimedCount || 0 },
    ];

    // 3. Revenue trend (scoped to date range)
    const revenueFrom = fromDate || (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5);
      d.setDate(1);
      return d;
    })();
    const revenueTo = toDate || now;
    const revenueDays = Math.ceil((revenueTo.getTime() - revenueFrom.getTime()) / (1000 * 60 * 60 * 24));
    const revenueMonthly = revenueDays > 90;

    const { data: revenueTransactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('status', 'succeeded')
      .gte('created_at', revenueFrom.toISOString())
      .lte('created_at', revenueTo.toISOString());

    let revenue_trend: { month: string; revenue: number }[];

    if (revenueMonthly) {
      const revenueByMonth: Record<string, number> = {};
      const cursor = new Date(revenueFrom.getFullYear(), revenueFrom.getMonth(), 1);
      const endMonth = new Date(revenueTo.getFullYear(), revenueTo.getMonth(), 1);
      while (cursor <= endMonth) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[key] = 0;
        cursor.setMonth(cursor.getMonth() + 1);
      }
      for (const tx of revenueTransactions || []) {
        const d = new Date(tx.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (revenueByMonth[key] !== undefined) {
          revenueByMonth[key] += tx.amount;
        }
      }
      revenue_trend = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));
    } else {
      const revenueByDate: Record<string, number> = {};
      for (let i = 0; i <= revenueDays; i++) {
        const d = new Date(revenueFrom);
        d.setDate(d.getDate() + i);
        revenueByDate[d.toISOString().split('T')[0]] = 0;
      }
      for (const tx of revenueTransactions || []) {
        const date = tx.created_at.split('T')[0];
        if (revenueByDate[date] !== undefined) {
          revenueByDate[date] += tx.amount;
        }
      }
      revenue_trend = Object.entries(revenueByDate).map(([month, revenue]) => ({ month, revenue }));
    }

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
