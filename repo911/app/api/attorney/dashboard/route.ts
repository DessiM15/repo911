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
      .select('amount')
      .eq('attorney_id', attorney.id)
      .eq('status', 'succeeded');

    const total_spent = (transactions || []).reduce((sum, t) => sum + t.amount, 0);

    // Recent claimed leads
    const { data: recent_leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, qualification_tier, repo_state, claimed_at')
      .eq('claimed_by', attorney.id)
      .order('claimed_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      available_leads: available_leads || 0,
      claimed_leads: claimed_leads || 0,
      total_spent,
      recent_leads: recent_leads || [],
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
