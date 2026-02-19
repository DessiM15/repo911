import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-response';

const statusLabels: Record<string, string> = {
  qualified_hot: 'Qualified — High Priority',
  qualified_warm: 'Qualified — Under Review',
  qualified_cold: 'Submitted — Pending Review',
  disqualified: 'Reviewed — Does Not Qualify',
  claimed: 'Claimed by Attorney',
  contacted: 'Attorney Has Contacted You',
  retained: 'Attorney Retained',
  closed: 'Case Closed',
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Authentication required', 401);
    }

    // Rate limit: 30 per user per 60 seconds
    const rl = rateLimit(`consumer_cases:${user.id}`, { limit: 30, windowSeconds: 60 });
    if (!rl.success) {
      return apiError('Too many requests. Please try again later.', 429, undefined, {
        'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
      });
    }

    // RLS automatically filters by consumer's email
    const { data: leads, error: queryError } = await supabase
      .from('leads')
      .select(
        'id, status, qualification_tier, created_at, claimed_by, vehicle_year, vehicle_make, vehicle_model, repo_state, lender_name, story_recorded_at, uploaded_files'
      )
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Consumer cases query error:', queryError);
      return apiError('Failed to fetch cases', 500);
    }

    const cases = (leads || []).map((lead) => ({
      id: lead.id,
      status: lead.status,
      statusLabel: statusLabels[lead.status] || lead.status,
      tier: lead.qualification_tier,
      submittedAt: lead.created_at,
      claimed: !!lead.claimed_by,
      vehicleYear: lead.vehicle_year,
      vehicleMake: lead.vehicle_make,
      vehicleModel: lead.vehicle_model,
      repoState: lead.repo_state,
      lenderName: lead.lender_name,
      hasStory: !!lead.story_recorded_at,
      uploadedFiles: lead.uploaded_files || [],
    }));

    return apiSuccess({ cases });
  } catch (error) {
    console.error('Consumer cases error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
