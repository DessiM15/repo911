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

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('claimed_by', attorney.id)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('My leads error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });
  } catch (error) {
    console.error('My leads error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
