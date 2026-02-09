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
    const caseStatus = searchParams.get('case_status');
    const paymentStatus = searchParams.get('payment_status');

    let query = supabase
      .from('fee_tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (caseStatus) query = query.eq('case_status', caseStatus);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);

    const { data: fees } = await query;

    // Get attorney names
    const attorneyIds = [...new Set((fees || []).map((f) => f.attorney_id).filter(Boolean))];
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

    // Summary stats
    const allFees = fees || [];
    const total_owed = allFees
      .filter((f) => f.payment_status !== 'paid')
      .reduce((sum, f) => sum + (f.repo911_share || 0), 0);
    const total_collected = allFees
      .filter((f) => f.payment_status === 'paid')
      .reduce((sum, f) => sum + (f.repo911_share || 0), 0);
    const overdue_count = allFees.filter((f) => f.payment_status === 'overdue').length;

    return NextResponse.json({
      fees: allFees,
      attorneys,
      total_owed,
      total_collected,
      overdue_count,
    });
  } catch (error) {
    console.error('Fee tracking error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { fee_id, ...updates } = body;

    if (!fee_id) {
      return NextResponse.json({ error: 'Missing fee_id' }, { status: 400 });
    }

    const allowedFields = ['case_status', 'payment_status', 'attorney_total_fee', 'repo911_share', 'payment_due_date', 'payment_received_date', 'notes'];
    const cleanUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        cleanUpdates[field] = updates[field];
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('fee_tracking')
      .update(cleanUpdates)
      .eq('id', fee_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fee tracking update error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
