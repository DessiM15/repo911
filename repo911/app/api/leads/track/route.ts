import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { leadTrackSchema } from '@/lib/validations/consumer';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 lookups per IP per 15 minutes
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`lead_track:${ip}`, { limit: 10, windowSeconds: 900 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many requests. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const body = await request.json();

    const parsed = leadTrackSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { mode } = parsed.data;

    const supabase = createAdminClient();

    let lead;

    if (mode === 'case_id') {
      const { email, leadId } = parsed.data;
      const { data, error: leadError } = await supabase
        .from('leads')
        .select('id, status, qualification_tier, created_at, claimed_by, uploaded_files, story_recorded_at, email_verified')
        .eq('id', leadId)
        .eq('email', email.toLowerCase().trim())
        .single();
      if (leadError || !data) {
        return apiError('No case found matching those details.', 404);
      }
      lead = data;
    } else {
      const { phone, lastName } = parsed.data;
      const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
      const { data, error: leadError } = await supabase
        .from('leads')
        .select('id, status, qualification_tier, created_at, claimed_by, uploaded_files, story_recorded_at, email_verified')
        .eq('last_name', lastName.trim())
        .ilike('phone', `%${normalizedPhone}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (leadError || !data) {
        return apiError('No case found matching those details.', 404);
      }
      lead = data;
    }

    // Return safe info only — no attorney details exposed
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

    return apiSuccess({
      id: lead.id,
      status: lead.status,
      statusLabel: statusLabels[lead.status] || lead.status,
      tier: lead.qualification_tier,
      submittedAt: lead.created_at,
      claimed: !!lead.claimed_by,
      uploadedFiles: lead.uploaded_files || [],
      hasStory: !!lead.story_recorded_at,
      emailVerified: lead.email_verified,
    });
  } catch (error) {
    console.error('Lead tracking error:', error);
    return apiError('An unexpected error occurred. Please try again.', 500);
  }
}
