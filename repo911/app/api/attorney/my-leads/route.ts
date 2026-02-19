import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAttorney } from '@/lib/auth/verify-attorney';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const offset = (page - 1) * limit;

    const { data: leads, count, error } = await supabase
      .from('leads')
      .select(
        'id, first_name, last_name, email, phone, city, state, street_address, zip_code, qualification_tier, qualification_score, repo_state, repo_date, claimed_at, status, vehicle_year, vehicle_make, vehicle_model, lender_name',
        { count: 'exact' }
      )
      .eq('claimed_by', attorney.id)
      .order('claimed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('My leads error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('My leads error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
