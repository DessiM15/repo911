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

    // Total leads
    const { count: total_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // Qualified leads (hot + warm + cold)
    const { count: qualified_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['qualified_hot', 'qualified_warm', 'qualified_cold', 'claimed']);

    // Claimed leads
    const { count: claimed_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'claimed');

    // Disqualified leads
    const { count: disqualified_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disqualified');

    // Total attorneys
    const { count: total_attorneys } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true });

    // Active attorneys
    const { count: active_attorneys } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Revenue from transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('status', 'succeeded');

    const total_revenue = (transactions || []).reduce((sum, t) => sum + t.amount, 0);

    // This month's revenue
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const this_month_revenue = (transactions || [])
      .filter((t) => t.created_at >= firstOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    // Conversion rates
    const totalLeadsCount = total_leads || 0;
    const qualifiedCount = qualified_leads || 0;
    const claimedCount = claimed_leads || 0;
    const qualification_rate = totalLeadsCount > 0 ? Math.round((qualifiedCount / totalLeadsCount) * 100) : 0;
    const claim_rate = qualifiedCount > 0 ? Math.round((claimedCount / qualifiedCount) * 100) : 0;

    // Recent leads (last 10)
    const { data: recent_leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, status, qualification_tier, qualification_score, repo_state, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Recent transactions (last 5)
    const { data: recent_transactions } = await supabase
      .from('transactions')
      .select('id, amount, status, created_at, attorney_id, lead_id')
      .order('created_at', { ascending: false })
      .limit(5);

    // Leads by tier
    const { count: hot_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('qualification_tier', 'hot');

    const { count: warm_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('qualification_tier', 'warm');

    const { count: cold_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('qualification_tier', 'cold');

    return NextResponse.json({
      total_leads: total_leads || 0,
      qualified_leads: qualifiedCount,
      claimed_leads: claimedCount,
      disqualified_leads: disqualified_leads || 0,
      total_attorneys: total_attorneys || 0,
      active_attorneys: active_attorneys || 0,
      total_revenue,
      this_month_revenue,
      qualification_rate,
      claim_rate,
      hot_leads: hot_leads || 0,
      warm_leads: warm_leads || 0,
      cold_leads: cold_leads || 0,
      recent_leads: recent_leads || [],
      recent_transactions: recent_transactions || [],
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
