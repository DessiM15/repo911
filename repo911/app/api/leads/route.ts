import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { intakeFormSchema } from '@/lib/validations/intake-form';
import { qualifyLead } from '@/lib/qualification-engine';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLeadSubmissionConfirmation, sendEmailVerification } from '@/lib/emails';
import { sendSubmissionConfirmationSms } from '@/lib/sms';
import { rateLimit } from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-response';
import type { LeadSubmission } from '@/types';

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 submissions per IP per 15 minutes
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`lead_submit:${ip}`, { limit: 5, windowSeconds: 900 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many submissions. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const body = await request.json();

    // Verify Turnstile CAPTCHA token
    const turnstileToken = body.turnstile_token;
    if (!turnstileToken || typeof turnstileToken !== 'string') {
      return apiError('CAPTCHA verification required.', 400);
    }
    const turnstileValid = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileValid) {
      return apiError('CAPTCHA verification failed. Please try again.', 400);
    }
    delete body.turnstile_token;

    // Validate input
    const parsed = intakeFormSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const data = parsed.data as LeadSubmission;

    // Run qualification engine
    const qualification = qualifyLead(data);

    // Determine lead status based on qualification
    let status: string;
    switch (qualification.tier) {
      case 'hot':
        status = 'qualified_hot';
        break;
      case 'warm':
        status = 'qualified_warm';
        break;
      case 'cold':
        status = 'qualified_cold';
        break;
      default:
        status = 'disqualified';
    }

    // Get metadata from request
    const ip_address =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // UTM parameters (optional, not validated by Zod)
    const utm_source = body.utm_source || null;
    const utm_medium = body.utm_medium || null;
    const utm_campaign = body.utm_campaign || null;
    const utm_content = body.utm_content || null;
    const utm_term = body.utm_term || null;

    // Store in Supabase using admin client (bypasses RLS for insert)
    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        status,
        // Contact Info
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        preferred_contact: data.preferred_contact,
        best_time_to_contact: data.best_time_to_contact || null,
        street_address: data.street_address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        // Vehicle Info
        vehicle_year: data.vehicle_year,
        vehicle_make: data.vehicle_make,
        vehicle_model: data.vehicle_model,
        vehicle_color: data.vehicle_color || null,
        vin: data.vin || null,
        lease_or_finance: data.lease_or_finance,
        // Lender Info
        lender_name: data.lender_name,
        repo_company_name: data.repo_company_name || null,
        behind_on_payments: data.behind_on_payments,
        payments_behind: data.payments_behind || null,
        contacted_lender_about_arrangements: data.contacted_lender_about_arrangements ?? null,
        received_written_notice: data.received_written_notice,
        // Repo Details
        repo_date: data.repo_date,
        repo_time_of_day: data.repo_time_of_day,
        repo_location: data.repo_location,
        repo_state: data.repo_state,
        // Breach of Peace
        verbally_objected: data.verbally_objected,
        continued_after_objection: data.continued_after_objection || null,
        physical_force_or_threats: data.physical_force_or_threats,
        excessive_noise: data.excessive_noise,
        entered_locked_area: data.entered_locked_area,
        property_damage: data.property_damage,
        police_present: data.police_present,
        police_assisted: data.police_assisted || null,
        repo_at_workplace: data.repo_at_workplace,
        public_embarrassment: data.public_embarrassment,
        narrative: data.narrative,
        // Personal Belongings
        had_belongings: data.had_belongings,
        belongings_returned: data.belongings_returned || null,
        belongings_list: data.belongings_list || null,
        belongings_value: data.belongings_value || null,
        charged_fee_for_belongings: data.charged_fee_for_belongings || false,
        // Post-Repo
        received_notice_of_sale: data.received_notice_of_sale,
        deficiency_balance_contact: data.deficiency_balance_contact,
        impacts: data.impacts || null,
        credit_report_affected: data.credit_report_affected || null,
        // Military
        military_service: data.military_service,
        military_branch: data.military_branch || null,
        active_duty_at_repo: data.active_duty_at_repo || false,
        loan_before_active_duty: data.loan_before_active_duty || null,
        // FDCPA
        debt_collector_contact: data.debt_collector_contact,
        fdcpa_violations: data.fdcpa_violations || null,
        // Evidence
        has_photos_videos: data.has_photos_videos,
        has_documents: data.has_documents,
        has_witnesses: data.has_witnesses,
        witness_info: data.witness_info || null,
        // Qualification
        qualification_score: qualification.score,
        qualification_tier: qualification.tier,
        qualification_breakdown: qualification.breakdown,
        // Consent
        electronic_signature: data.electronic_signature,
        consent_accurate_info: data.consent_accurate_info,
        consent_not_legal_advice: data.consent_not_legal_advice,
        consent_contact: data.consent_contact,
        consent_privacy_policy: data.consent_privacy_policy,
        // Metadata
        ip_address,
        user_agent,
        // UTM / Marketing Attribution
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        referrer,
      })
      .select('id, qualification_tier, qualification_score')
      .single();

    if (leadError) {
      console.error('Lead insert error:', leadError);
      return apiError('Failed to submit your case. Please try again.', 500);
    }

    // Create CRM contact record
    const tags: string[] = [];
    if (qualification.tier === 'hot') tags.push('hot_lead');
    if (qualification.tier === 'warm') tags.push('warm_lead');
    if (qualification.breakdown.breach_of_peace > 0) tags.push('breach_of_peace');
    if (qualification.breakdown.military > 0) tags.push('military', 'scra');
    if (qualification.breakdown.fdcpa > 0) tags.push('fdcpa');
    if (qualification.breakdown.belongings > 0) tags.push('belongings');

    await supabase.from('crm_contacts').insert({
      contact_type: 'consumer',
      source_lead_id: lead.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      state: data.state,
      city: data.city,
      tags,
      lifecycle_stage: qualification.tier === 'disqualified' ? 'closed' : 'new',
    });

    // Log CRM activity
    const { data: crmContact } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('source_lead_id', lead.id)
      .single();

    if (crmContact) {
      await supabase.from('crm_activities').insert({
        contact_id: crmContact.id,
        activity_type: 'status_change',
        description: `Lead submitted. Qualification: ${qualification.tier} (score: ${qualification.score})`,
        metadata: { qualification },
      });
    }

    // Create email verification token (24hr expiry)
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('lead_email_verifications').insert({
      lead_id: lead.id,
      token: verificationToken,
      expires_at: expiresAt,
    });

    // Send emails/SMS (fire-and-forget, don't block the response)
    try {
      // 1. Verification email to consumer
      sendEmailVerification({
        to: data.email,
        firstName: data.first_name,
        verificationUrl: `${APP_URL}/verify?token=${verificationToken}`,
      }).catch(() => { /* non-critical */ });

      // 2. Confirmation email to consumer
      await sendLeadSubmissionConfirmation({
        to: data.email,
        firstName: data.first_name,
        tier: qualification.tier,
        score: qualification.score,
      });

      // 3. SMS confirmation to consumer (fire-and-forget)
      sendSubmissionConfirmationSms(
        { phone: data.phone, preferred_contact: data.preferred_contact },
        lead.id
      ).catch(() => { /* non-critical */ });

      // Attorney notifications are sent AFTER email verification (see /api/leads/verify)
    } catch {
      // Email failures should not block lead submission
      console.error('Email notification error (non-critical)');
    }

    return apiSuccess({
      id: lead.id,
      tier: lead.qualification_tier,
      score: lead.qualification_score,
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    return apiError('An unexpected error occurred. Please try again.', 500);
  }
}
