import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailVerification } from '@/lib/emails';
import { rateLimit } from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-response';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, email } = body;

    if (!lead_id || !email) {
      return apiError('lead_id and email are required.', 400);
    }

    // Rate limit: 3 per email per hour
    const emailKey = email.toLowerCase().trim();
    const rateLimitResult = rateLimit(`resend_verify:${emailKey}`, { limit: 3, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return apiError('Too many resend requests. Please try again later.', 429, undefined, {
        'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
      });
    }

    const supabase = createAdminClient();

    // Verify lead exists and email matches (case-insensitive)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, first_name, email, email_verified')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return apiError('No case found.', 404);
    }

    if (lead.email.toLowerCase() !== emailKey) {
      return apiError('Email does not match our records.', 400);
    }

    // Already verified — return success without sending email
    if (lead.email_verified) {
      return apiSuccess({ message: 'Your email is already verified.' });
    }

    // Create new verification token (24hr expiry)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: verification } = await supabase
      .from('lead_email_verifications')
      .insert({
        lead_id: lead.id,
        expires_at: expiresAt,
      })
      .select('token')
      .single();

    if (verification) {
      sendEmailVerification({
        to: lead.email,
        firstName: lead.first_name,
        verificationUrl: `${APP_URL}/verify?token=${verification.token}`,
      }).catch(() => { /* non-critical */ });
    }

    return apiSuccess({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return apiError('An unexpected error occurred.', 500);
  }
}
