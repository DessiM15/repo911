import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAttorney } from '@/lib/auth/verify-attorney';

export async function GET() {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
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
