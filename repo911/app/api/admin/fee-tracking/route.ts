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
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    // If searching, find matching attorney IDs first
    let matchingAttorneyIds: string[] | null = null;
    if (search) {
      const { data: matchedAttorneys } = await supabase
        .from('attorneys')
        .select('id')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      matchingAttorneyIds = (matchedAttorneys || []).map((a) => a.id);
    }

    let query = supabase
      .from('fee_tracking')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (caseStatus) query = query.eq('case_status', caseStatus);

    if (search) {
      if (matchingAttorneyIds && matchingAttorneyIds.length > 0) {
        query = query.or(`notes.ilike.%${search}%,attorney_id.in.(${matchingAttorneyIds.join(',')})`);
      } else {
        query = query.ilike('notes', `%${search}%`);
      }
    }

    query = query.range(offset, offset + limit - 1);

    const { data: fees, count } = await query;

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

    const total = count || 0;

    return NextResponse.json({
      fees: fees || [],
      attorneys,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

    // Verify fee record exists and fetch old values
    const { data: existingFee } = await supabase
      .from('fee_tracking')
      .select('id, case_status, lead_id')
      .eq('id', fee_id)
      .single();

    if (!existingFee) {
      return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    }

    const VALID_CASE_STATUSES = ['open', 'in_progress', 'settled', 'dismissed', 'closed', 'paid'];

    if (updates.case_status && !VALID_CASE_STATUSES.includes(updates.case_status)) {
      return NextResponse.json({ error: 'Invalid case_status' }, { status: 400 });
    }
    if (updates.attorney_total_fee !== undefined) {
      const fee = Number(updates.attorney_total_fee);
      if (isNaN(fee) || fee < 0) {
        return NextResponse.json({ error: 'attorney_total_fee must be a non-negative number' }, { status: 400 });
      }
    }

    const allowedFields = ['case_status', 'attorney_total_fee', 'notes'];
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

    // Log status_change activity if case_status changed (fire-and-forget)
    if (updates.case_status && existingFee.case_status !== updates.case_status && existingFee.lead_id) {
      supabase
        .from('crm_contacts')
        .select('id')
        .eq('source_lead_id', existingFee.lead_id)
        .single()
        .then(({ data: contact }) => {
          if (contact) {
            supabase.from('crm_activities').insert({
              contact_id: contact.id,
              activity_type: 'status_change',
              description: `Case status changed from ${existingFee.case_status} to ${updates.case_status}`,
              performed_by: admin.id,
              metadata: { field: 'case_status', old_value: existingFee.case_status, new_value: updates.case_status },
            }).then(() => {});
          }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fee tracking update error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
