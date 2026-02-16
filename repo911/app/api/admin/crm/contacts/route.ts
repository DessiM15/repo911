import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeSearchParam } from '@/lib/sanitize';

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('crm_contacts')
      .select('*', { count: 'exact' });

    if (type) query = query.eq('contact_type', type);
    if (stage) query = query.eq('lifecycle_stage', stage);
    if (search) {
      const s = sanitizeSearchParam(search);
      query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: contacts, count } = await query;

    return NextResponse.json({
      contacts: contacts || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('CRM contacts error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
