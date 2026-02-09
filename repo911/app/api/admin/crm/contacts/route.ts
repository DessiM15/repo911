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
    const type = searchParams.get('type');
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');

    let query = supabase
      .from('crm_contacts')
      .select('*');

    if (type) query = query.eq('contact_type', type);
    if (stage) query = query.eq('lifecycle_stage', stage);
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    query = query.order('updated_at', { ascending: false });

    const { data: contacts } = await query;

    return NextResponse.json({ contacts: contacts || [] });
  } catch (error) {
    console.error('CRM contacts error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
