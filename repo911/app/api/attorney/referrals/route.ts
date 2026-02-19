import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { verifyAttorney } from '@/lib/auth/verify-attorney';

export async function GET() {
  try {
    const supabase = await createClient();

    const { attorney, error: authError } = await verifyAttorney(supabase, 'id, referral_code, referral_credits');
    if (authError) {
      return apiError(authError.message, authError.status);
    }

    // Fetch referrals with referred attorney names
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, created_at, referred_id, status, completed_at, credit_awarded, referral_code')
      .eq('referrer_id', attorney.id)
      .order('created_at', { ascending: false });

    // Get referred attorney names
    const referredIds = (referrals || []).map((r) => r.referred_id);
    let referredAttorneys: Record<string, string> = {};
    if (referredIds.length > 0) {
      const { data: attorneys } = await supabase
        .from('attorneys')
        .select('id, first_name, last_name')
        .in('id', referredIds);

      if (attorneys) {
        referredAttorneys = Object.fromEntries(
          attorneys.map((a) => [a.id, `${a.first_name} ${a.last_name}`])
        );
      }
    }

    const referralsWithNames = (referrals || []).map((r) => ({
      ...r,
      referred_name: referredAttorneys[r.referred_id] || 'Unknown',
    }));

    return apiSuccess({
      referral_code: attorney.referral_code,
      referral_credits: attorney.referral_credits,
      referrals: referralsWithNames,
    });
  } catch (error) {
    console.error('Referrals fetch error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
