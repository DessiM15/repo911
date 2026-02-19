import { NextRequest } from 'next/server';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Authentication required', 401);
    }

    // Rate limit: 30 per user per 60 seconds
    const rl = rateLimit(`consumer_case_detail:${user.id}`, { limit: 30, windowSeconds: 60 });
    if (!rl.success) {
      return apiError('Too many requests. Please try again later.', 429, undefined, {
        'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
      });
    }

    // RLS enforces ownership
    const { data: lead, error: queryError } = await supabase
      .from('leads')
      .select(
        'id, status, qualification_tier, created_at, claimed_by, vehicle_year, vehicle_make, vehicle_model, repo_date, repo_state, lender_name, first_name, last_name, email, story_recorded_at, uploaded_files'
      )
      .eq('id', id)
      .single();

    if (queryError || !lead) {
      return apiError('Case not found', 404);
    }

    let feeTracking = null;
    let timeline: { status: string; date: string; note?: string }[] = [];

    if (lead.claimed_by) {
      // RLS allows consumer to read their own fee_tracking
      const { data: ft } = await supabase
        .from('fee_tracking')
        .select('case_status, status_history, settlement_amount, status_updated_at')
        .eq('lead_id', id)
        .single();

      if (ft) {
        feeTracking = {
          caseStatus: ft.case_status,
          settlementAmount: ft.settlement_amount,
          statusUpdatedAt: ft.status_updated_at,
        };

        // Build timeline from status_history
        const history = (ft.status_history || []) as { from: string; to: string; changed_at: string; note?: string }[];
        timeline = history.map((entry) => ({
          status: entry.to,
          date: entry.changed_at,
          note: entry.note,
        }));
      }
    }

    // Always include "Submitted" as first timeline entry
    timeline.unshift({
      status: 'submitted',
      date: lead.created_at,
    });

    return apiSuccess({
      case: {
        id: lead.id,
        status: lead.status,
        statusLabel: statusLabels[lead.status] || lead.status,
        tier: lead.qualification_tier,
        submittedAt: lead.created_at,
        claimed: !!lead.claimed_by,
        vehicleYear: lead.vehicle_year,
        vehicleMake: lead.vehicle_make,
        vehicleModel: lead.vehicle_model,
        repoDate: lead.repo_date,
        repoState: lead.repo_state,
        lenderName: lead.lender_name,
        firstName: lead.first_name,
        lastName: lead.last_name,
        email: lead.email,
        hasStory: !!lead.story_recorded_at,
        uploadedFiles: lead.uploaded_files || [],
        feeTracking,
        timeline,
      },
    });
  } catch (error) {
    console.error('Consumer case detail error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
