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
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('attorneys')
      .select('id, first_name, last_name, email, phone, firm_name, bar_number, bar_state, status, is_verified, fee_agreement_signed, created_at, stripe_customer_id');

    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,firm_name.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: attorneys } = await query;

    return NextResponse.json({ attorneys: attorneys || [] });
  } catch (error) {
    console.error('Admin attorneys error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
