import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAttorney } from '@/lib/auth/verify-attorney';

export async function GET() {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    // Available leads count
    const { count: available_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['qualified_hot', 'qualified_warm', 'qualified_cold'])
      .is('claimed_by', null);

    // My claimed leads count
    const { count: claimed_leads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('claimed_by', attorney.id);

    // Total spent
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('attorney_id', attorney.id)
      .eq('status', 'succeeded');

    const txList = transactions || [];
    const total_spent = txList.reduce((sum, t) => sum + t.amount, 0);

    // This month spent
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const this_month_spent = txList
      .filter((t) => t.created_at >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0);

    // Avg cost per lead
    const claimedCount = claimed_leads || 0;
    const avg_cost_per_lead = claimedCount > 0 ? total_spent / claimedCount : 0;

    // Leads by tier
    const { data: tierData } = await supabase
      .from('leads')
      .select('qualification_tier')
      .eq('claimed_by', attorney.id);

    const leads_by_tier = { hot: 0, warm: 0, cold: 0 };
    for (const lead of tierData || []) {
      const tier = lead.qualification_tier as keyof typeof leads_by_tier;
      if (tier in leads_by_tier) {
        leads_by_tier[tier]++;
      }
    }

    // Case outcomes
    const { data: feeData } = await supabase
      .from('fee_tracking')
      .select('case_status, settlement_amount')
      .eq('attorney_id', attorney.id);

    const case_outcomes = { open: 0, in_progress: 0, settled: 0, dismissed: 0, closed: 0, paid: 0 };
    let total_settlement_value = 0;
    for (const fee of feeData || []) {
      const status = fee.case_status as keyof typeof case_outcomes;
      if (status in case_outcomes) {
        case_outcomes[status]++;
      }
      if (fee.settlement_amount) {
        total_settlement_value += Number(fee.settlement_amount);
      }
    }

    // Recent claimed leads
    const { data: recent_leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, qualification_tier, repo_state, claimed_at')
      .eq('claimed_by', attorney.id)
      .order('claimed_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      available_leads: available_leads || 0,
      claimed_leads: claimedCount,
      total_spent,
      this_month_spent,
      avg_cost_per_lead,
      leads_by_tier,
      case_outcomes,
      total_settlement_value,
      recent_leads: recent_leads || [],
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
