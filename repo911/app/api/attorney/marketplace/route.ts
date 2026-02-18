import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEstimatedValueRange } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';
import { verifyAttorney } from '@/lib/auth/verify-attorney';
import type { MarketplaceLead, QualificationBreakdown } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify attorney auth (all 4 checks: auth, table, fee agreement, status)
    const { attorney, error: authError } = await verifyAttorney(supabase, 'id');
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    // Rate limit: 60 requests per user per minute
    const rateLimitResult = rateLimit(`attorney_marketplace:${attorney.id}`, { limit: 60, windowSeconds: 60 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get('tier');
    const state = searchParams.get('state');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const offset = (page - 1) * limit;

    // Build query — only show qualified, unclaimed leads
    let query = supabase
      .from('leads')
      .select(`
        id, created_at, qualification_tier, qualification_score,
        qualification_breakdown, repo_state, repo_date, lender_name,
        vehicle_year, vehicle_make, vehicle_model,
        verbally_objected, continued_after_objection,
        physical_force_or_threats, entered_locked_area, property_damage,
        police_assisted, had_belongings, belongings_returned,
        military_service, active_duty_at_repo,
        debt_collector_contact, fdcpa_violations,
        received_written_notice, received_notice_of_sale,
        has_photos_videos, has_documents, has_witnesses,
        narrative, story_transcript, story_recorded_at
      `, { count: 'exact' })
      .in('status', ['qualified_hot', 'qualified_warm', 'qualified_cold'])
      .is('claimed_by', null);

    if (tier) {
      query = query.eq('qualification_tier', tier);
    }
    if (state) {
      query = query.eq('repo_state', state);
    }

    switch (sort) {
      case 'score_desc':
        query = query.order('qualification_score', { ascending: false });
        break;
      case 'score_asc':
        query = query.order('qualification_score', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('qualification_score', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('qualification_score', { ascending: true }).order('created_at', { ascending: false });
        break;
      case 'state_asc':
        query = query.order('repo_state', { ascending: true }).order('created_at', { ascending: false });
        break;
      case 'state_desc':
        query = query.order('repo_state', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: leads, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Marketplace query error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Transform leads to marketplace format (anonymized)
    const marketplaceLeads: MarketplaceLead[] = (leads || []).map((lead) => {
      const breakdown = lead.qualification_breakdown as QualificationBreakdown | null;
      const violations: string[] = [];

      if (breakdown) {
        if (breakdown.breach_of_peace > 0) violations.push('Breach of Peace');
        if (breakdown.belongings > 0) violations.push('Personal Belongings');
        if (breakdown.military > 0) violations.push('SCRA Violation');
        if (breakdown.fdcpa > 0) violations.push('FDCPA Violation');
        if (breakdown.notice > 0) violations.push('Notice Violation');
      }

      const narrativePreview = lead.narrative
        ? lead.narrative.substring(0, 200).replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, '[Name]') + (lead.narrative.length > 200 ? '...' : '')
        : null;

      const storyTranscriptPreview = lead.story_transcript
        ? lead.story_transcript.substring(0, 200).replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, '[Name]') + (lead.story_transcript.length > 200 ? '...' : '')
        : null;

      return {
        id: lead.id,
        qualification_tier: lead.qualification_tier,
        qualification_score: lead.qualification_score,
        repo_state: lead.repo_state || '',
        repo_date: lead.repo_date || '',
        lender_name: lead.lender_name,
        violation_types: violations,
        estimated_value_range: getEstimatedValueRange(lead.qualification_score),
        vehicle_year: lead.vehicle_year,
        vehicle_make: lead.vehicle_make,
        vehicle_model: lead.vehicle_model,
        has_evidence: lead.has_photos_videos || lead.has_documents || lead.has_witnesses,
        has_story: !!lead.story_recorded_at,
        story_transcript_preview: storyTranscriptPreview,
        fdcpa_violation_count: lead.fdcpa_violations?.length || 0,
        narrative_preview: narrativePreview,
        qualification_breakdown: breakdown,
        created_at: lead.created_at,
      };
    });

    return NextResponse.json({ leads: marketplaceLeads, total: count || 0, page, limit });
  } catch (error) {
    console.error('Marketplace error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
