import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyMatchingAttorneys } from '@/lib/attorney-notifications';
import { rateLimit } from '@/lib/rate-limit';
import type { QualificationBreakdown } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 20 per IP per minute
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`email_verify:${ip}`, { limit: 20, windowSeconds: 60 });
    if (!rateLimitResult.success) {
      return NextResponse.redirect(`${APP_URL}/verify?status=invalid`);
    }

    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(`${APP_URL}/verify?status=invalid`);
    }

    const supabase = createAdminClient();

    // Look up token
    const { data: verification, error: verifyError } = await supabase
      .from('lead_email_verifications')
      .select('id, lead_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (verifyError || !verification) {
      return NextResponse.redirect(`${APP_URL}/verify?status=invalid`);
    }

    // Already used
    if (verification.used_at) {
      return NextResponse.redirect(`${APP_URL}/verify?status=already_verified`);
    }

    // Expired
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.redirect(`${APP_URL}/verify?status=expired&lead_id=${verification.lead_id}`);
    }

    // Mark token as used
    await supabase
      .from('lead_email_verifications')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verification.id);

    // Set email_verified = true on the lead
    await supabase
      .from('leads')
      .update({ email_verified: true })
      .eq('id', verification.lead_id);

    // Fetch lead details for attorney notifications
    const { data: lead } = await supabase
      .from('leads')
      .select('qualification_tier, repo_state, qualification_breakdown')
      .eq('id', verification.lead_id)
      .single();

    if (lead && (lead.qualification_tier === 'hot' || lead.qualification_tier === 'warm')) {
      notifyMatchingAttorneys({
        tier: lead.qualification_tier,
        repoState: lead.repo_state,
        qualificationBreakdown: lead.qualification_breakdown as QualificationBreakdown,
      }).catch(() => { /* non-critical */ });
    }

    return NextResponse.redirect(`${APP_URL}/verify?status=success&id=${verification.lead_id}`);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(`${APP_URL}/verify?status=invalid`);
  }
}
