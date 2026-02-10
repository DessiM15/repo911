import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get claiming attorney info if claimed
    let attorney = null;
    if (lead.claimed_by) {
      const { data: atty } = await supabase
        .from('attorneys')
        .select('id, first_name, last_name, email, firm_name')
        .eq('id', lead.claimed_by)
        .single();
      attorney = atty;
    }

    // Get transaction for this lead
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ lead, attorney, transaction });
  } catch (error) {
    console.error('Admin lead detail error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();

    const VALID_STATUSES = ['pending', 'qualified_hot', 'qualified_warm', 'qualified_cold', 'disqualified', 'claimed', 'closed'];
    const VALID_TIERS = ['hot', 'warm', 'cold', 'disqualified'];

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    if (body.qualification_tier && !VALID_TIERS.includes(body.qualification_tier)) {
      return NextResponse.json({ error: 'Invalid qualification tier' }, { status: 400 });
    }
    if (body.qualification_score !== undefined) {
      const score = Number(body.qualification_score);
      if (isNaN(score) || score < 0 || score > 200) {
        return NextResponse.json({ error: 'Invalid qualification score (0-200)' }, { status: 400 });
      }
    }

    const allowedFields = ['status', 'qualification_tier', 'qualification_score'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin lead update error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
