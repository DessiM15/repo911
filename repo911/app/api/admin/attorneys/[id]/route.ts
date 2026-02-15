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

    const { data: attorney, error } = await supabase
      .from('attorneys')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 });
    }

    // Get claimed leads
    const { data: claimed_leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, qualification_tier, qualification_score, repo_state, claimed_at, status')
      .eq('claimed_by', id)
      .order('claimed_at', { ascending: false });

    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('attorney_id', id)
      .order('created_at', { ascending: false });

    const total_spent = (transactions || [])
      .filter((t) => t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      attorney,
      claimed_leads: claimed_leads || [],
      transactions: transactions || [],
      total_spent,
    });
  } catch (error) {
    console.error('Admin attorney detail error:', error);
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
      .select('id, email')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ['status', 'is_verified'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Fetch old values before update
    const { data: oldAttorney } = await supabase
      .from('attorneys')
      .select('status, is_verified')
      .eq('id', id)
      .single();

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('attorneys')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update attorney' }, { status: 500 });
    }

    // Insert audit log entry (fire-and-forget)
    if (oldAttorney) {
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};
      for (const field of Object.keys(updates)) {
        if (field === 'updated_at') continue;
        if (updates[field] !== (oldAttorney as Record<string, unknown>)[field]) {
          oldValues[field] = (oldAttorney as Record<string, unknown>)[field];
          newValues[field] = updates[field];
        }
      }
      if (Object.keys(newValues).length > 0) {
        supabase.from('admin_audit_log').insert({
          admin_id: admin.id,
          admin_email: admin.email,
          action: 'update_attorney',
          entity_type: 'attorney',
          entity_id: id,
          old_values: oldValues,
          new_values: newValues,
          ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
        }).then(() => {});
      }
    }

    // Log status_change activity (fire-and-forget)
    if (oldAttorney && body.status && body.status !== oldAttorney.status) {
      supabase
        .from('crm_contacts')
        .select('id')
        .eq('source_attorney_id', id)
        .single()
        .then(({ data: contact }) => {
          if (contact) {
            supabase.from('crm_activities').insert({
              contact_id: contact.id,
              activity_type: 'status_change',
              description: `Attorney status changed from ${oldAttorney.status} to ${body.status}`,
              performed_by: admin.id,
              metadata: { field: 'status', old_value: oldAttorney.status, new_value: body.status },
            }).then(() => {});
          }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin attorney update error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
