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

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get activities
    const { data: activities } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false });

    // Get associated lead/attorney
    let lead = null;
    let attorney = null;
    if (contact.source_lead_id) {
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, status, qualification_tier, qualification_score')
        .eq('id', contact.source_lead_id)
        .single();
      lead = data;
    }
    if (contact.source_attorney_id) {
      const { data } = await supabase
        .from('attorneys')
        .select('id, first_name, last_name, status, firm_name')
        .eq('id', contact.source_attorney_id)
        .single();
      attorney = data;
    }

    return NextResponse.json({
      contact,
      activities: activities || [],
      lead,
      attorney,
    });
  } catch (error) {
    console.error('CRM contact detail error:', error);
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

    // Handle adding a note
    if (body.add_note) {
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('notes')
        .eq('id', id)
        .single();

      const currentNotes = contact?.notes || [];
      const newNote = {
        timestamp: new Date().toISOString(),
        author: 'Admin',
        note_text: body.add_note,
      };

      await supabase
        .from('crm_contacts')
        .update({
          notes: [...currentNotes, newNote],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Log activity
      await supabase.from('crm_activities').insert({
        contact_id: id,
        activity_type: 'note',
        description: body.add_note,
        performed_by: admin.id,
      });

      return NextResponse.json({ success: true });
    }

    // Handle field updates
    const allowedFields = ['lifecycle_stage', 'tags', 'next_follow_up'];
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
      .from('crm_contacts')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CRM contact update error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
