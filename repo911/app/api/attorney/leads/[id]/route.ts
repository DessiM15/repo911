import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEstimatedValueRange } from '@/lib/utils';
import { attorneyLeadUpdateSchema } from '@/lib/validations/attorney';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { QualificationBreakdown } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return apiError('Lead not found', 404);
    }

    // Check if this attorney has claimed this lead
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    const isClaimed = lead.claimed_by !== null;
    const isMyLead = attorney && lead.claimed_by === attorney.id;

    if (isClaimed && !isMyLead) {
      return apiError('This lead has already been claimed', 403);
    }

    const breakdown = lead.qualification_breakdown as QualificationBreakdown | null;
    const violations: string[] = [];
    if (breakdown) {
      if (breakdown.breach_of_peace > 0) violations.push('Breach of Peace');
      if (breakdown.belongings > 0) violations.push('Personal Belongings');
      if (breakdown.military > 0) violations.push('SCRA Violation');
      if (breakdown.fdcpa > 0) violations.push('FDCPA Violation');
      if (breakdown.notice > 0) violations.push('Notice Violation');
    }

    // If claimed by this attorney, return full info + fee tracking data
    if (isMyLead) {
      const { data: feeTracking } = await supabase
        .from('fee_tracking')
        .select('case_status, notes')
        .eq('lead_id', id)
        .eq('attorney_id', attorney.id)
        .single();

      return apiSuccess({ lead, violations, full_access: true, fee_tracking: feeTracking });
    }

    // Otherwise return anonymized version
    const anonymized = {
      id: lead.id,
      qualification_tier: lead.qualification_tier,
      qualification_score: lead.qualification_score,
      qualification_breakdown: lead.qualification_breakdown,
      repo_state: lead.repo_state,
      repo_date: lead.repo_date,
      repo_time_of_day: lead.repo_time_of_day,
      repo_location: lead.repo_location,
      lender_name: lead.lender_name,
      vehicle_year: lead.vehicle_year,
      vehicle_make: lead.vehicle_make,
      vehicle_model: lead.vehicle_model,
      lease_or_finance: lead.lease_or_finance,
      behind_on_payments: lead.behind_on_payments,
      received_written_notice: lead.received_written_notice,
      verbally_objected: lead.verbally_objected,
      continued_after_objection: lead.continued_after_objection,
      physical_force_or_threats: lead.physical_force_or_threats,
      excessive_noise: lead.excessive_noise,
      entered_locked_area: lead.entered_locked_area,
      property_damage: lead.property_damage,
      police_present: lead.police_present,
      police_assisted: lead.police_assisted,
      repo_at_workplace: lead.repo_at_workplace,
      public_embarrassment: lead.public_embarrassment,
      had_belongings: lead.had_belongings,
      belongings_returned: lead.belongings_returned,
      military_service: lead.military_service,
      active_duty_at_repo: lead.active_duty_at_repo,
      debt_collector_contact: lead.debt_collector_contact,
      fdcpa_violations: lead.fdcpa_violations,
      received_notice_of_sale: lead.received_notice_of_sale,
      has_photos_videos: lead.has_photos_videos,
      has_documents: lead.has_documents,
      has_witnesses: lead.has_witnesses,
      narrative_preview: lead.narrative
        ? lead.narrative.substring(0, 200).replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, '[Name]') + '...'
        : null,
      estimated_value_range: getEstimatedValueRange(lead.qualification_score),
      created_at: lead.created_at,
      status: lead.status,
    };

    return apiSuccess({ lead: anonymized, violations, full_access: false });
  } catch (error) {
    console.error('Lead detail error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

/**
 * PATCH — Update case notes and status for a claimed lead.
 * Stores data in the fee_tracking table.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      return apiError('Attorney not found', 403);
    }

    // Verify this attorney owns this lead
    const { data: lead } = await supabase
      .from('leads')
      .select('id, claimed_by')
      .eq('id', id)
      .single();

    if (!lead || lead.claimed_by !== attorney.id) {
      return apiError('Access denied', 403);
    }

    const body = await request.json();

    const parsed = attorneyLeadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { case_status, notes } = parsed.data;

    const updates: Record<string, unknown> = {};
    if (case_status) updates.case_status = case_status;
    if (notes !== undefined) updates.notes = notes;

    // Fetch old case_status before updating (for CRM activity logging)
    let oldCaseStatus: string | null = null;
    if (case_status) {
      const { data: existingFee } = await supabase
        .from('fee_tracking')
        .select('case_status')
        .eq('lead_id', id)
        .eq('attorney_id', attorney.id)
        .single();
      oldCaseStatus = existingFee?.case_status ?? null;
    }

    const { error } = await supabase
      .from('fee_tracking')
      .update(updates)
      .eq('lead_id', id)
      .eq('attorney_id', attorney.id);

    if (error) {
      console.error('Fee tracking update error:', error);
      return apiError('Failed to save', 500);
    }

    // Log status_change activity if case_status changed (fire-and-forget)
    if (case_status && oldCaseStatus && oldCaseStatus !== case_status) {
      supabase
        .from('crm_contacts')
        .select('id')
        .eq('source_lead_id', id)
        .single()
        .then(({ data: contact }) => {
          if (contact) {
            supabase.from('crm_activities').insert({
              contact_id: contact.id,
              activity_type: 'status_change',
              description: `Case status changed from ${oldCaseStatus} to ${case_status}`,
              performed_by: attorney.id,
              metadata: { field: 'case_status', old_value: oldCaseStatus, new_value: case_status },
            }).then(() => {});
          }
        });
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Lead PATCH error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
