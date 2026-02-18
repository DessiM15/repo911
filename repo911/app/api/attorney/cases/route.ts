import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyAttorney } from '@/lib/auth/verify-attorney';
import { rateLimit } from '@/lib/rate-limit';
import type { CaseStatus } from '@/types';

const VALID_STATUSES: CaseStatus[] = ['open', 'in_progress', 'settled', 'dismissed', 'closed', 'paid'];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    const rl = rateLimit(`attorney-cases:${attorney.id}`, { limit: 60, windowSeconds: 60 });
    if (!rl.success) {
      return apiError('Too many requests', 429);
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as CaseStatus | null;
    const sort = searchParams.get('sort') || 'newest';

    // Stats query (always unfiltered for complete pipeline metrics)
    const { data: allFees } = await supabase
      .from('fee_tracking')
      .select('case_status, settlement_amount')
      .eq('attorney_id', attorney.id);

    const stats = {
      open: 0,
      in_progress: 0,
      settled: 0,
      dismissed: 0,
      closed: 0,
      paid: 0,
      total_settlement_value: 0,
    };

    for (const fee of allFees || []) {
      const s = fee.case_status as keyof typeof stats;
      if (s in stats && s !== 'total_settlement_value') {
        (stats[s] as number)++;
      }
      if (fee.settlement_amount) {
        stats.total_settlement_value += Number(fee.settlement_amount);
      }
    }

    // Cases query with lead join
    let query = supabase
      .from('fee_tracking')
      .select('id, created_at, lead_id, case_status, settlement_amount, status_updated_at, outcome_notes, leads!inner(first_name, last_name, vehicle_year, vehicle_make, vehicle_model, repo_state, qualification_tier, lender_name)')
      .eq('attorney_id', attorney.id);

    if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
      query = query.eq('case_status', statusFilter);
    }

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'updated') {
      query = query.order('status_updated_at', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: cases, error } = await query;

    if (error) {
      console.error('Cases fetch error:', error);
      return apiError('Failed to fetch cases', 500);
    }

    return apiSuccess({ cases: cases || [], stats });
  } catch (error) {
    console.error('Cases GET error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
