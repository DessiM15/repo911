import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { scrubPII } from '@/lib/error-tracking/scrubber';
import { checkAlertRules } from '@/lib/error-tracking/check-alerts';
import { rateLimit } from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Rate limit: 30 error reports per IP per minute
  const rateLimitResult = rateLimit(`error_track:${clientIp}`, { limit: 30, windowSeconds: 60 });
  if (!rateLimitResult.success) {
    return apiError('Rate limited', 429);
  }

  try {
    const body = await request.json();

    // Scrub all PII from the incoming payload
    const sanitized = scrubPII(body) as Record<string, unknown>;

    // Generate fingerprint
    const signature = `${sanitized.type}:${sanitized.message}:${extractSourceFile(sanitized.stack as string | undefined)}`;
    const fingerprint = crypto.createHash('md5').update(signature).digest('hex');

    const supabase = createAdminClient();

    // Find or create grouped error
    const { data: existingError } = await supabase
      .from('errors')
      .select('id')
      .eq('fingerprint', fingerprint)
      .single();

    let errorId: string;

    if (existingError) {
      errorId = existingError.id;
    } else {
      const { data: newError, error: insertError } = await supabase
        .from('errors')
        .insert({
          fingerprint,
          error_type: (sanitized.type as string) || 'Error',
          message: (sanitized.message as string) || 'Unknown error',
          platform: 'browser',
          level: (sanitized.level as string) || 'error',
          tags: (sanitized.tags as string[]) || [],
          environment: process.env.NODE_ENV || 'production',
        })
        .select('id')
        .single();

      if (insertError || !newError) {
        return apiError('Failed to track', 500);
      }
      errorId = newError.id;
    }

    // Parse browser info
    const browser = (sanitized.browser || {}) as Record<string, unknown>;

    // Create occurrence
    await supabase.from('error_occurrences').insert({
      error_id: errorId,
      stack_trace: sanitized.stack || null,
      source_file: extractSourceFile(sanitized.stack as string | undefined),
      line_number: extractLineNumber(sanitized.stack as string | undefined),
      column_number: extractColumnNumber(sanitized.stack as string | undefined),
      user_id: (sanitized.user as Record<string, unknown>)?.id || null,
      user_ip: scrubPII(clientIp) as string,
      user_agent: sanitized.userAgent || null,
      url: sanitized.url || null,
      breadcrumbs: sanitized.breadcrumbs || [],
      extra_data: sanitized.extra || {},
      browser_name: browser.name || null,
      browser_version: browser.version || null,
      os_name: browser.os || null,
      device_type: browser.device || null,
    });

    // Check alert rules (fire-and-forget)
    checkAlertRules(supabase, errorId).catch(() => {});

    return apiSuccess({ success: true, errorId });
  } catch (error) {
    console.error('Error tracking API failed:', error);
    return apiError('Failed to track error', 500);
  }
}

function extractSourceFile(stack?: string): string | null {
  if (!stack) return null;
  const match = stack.match(/(?:https?:\/\/[^/]+)?(.+?):\d+:\d+/);
  return match?.[1] || null;
}

function extractLineNumber(stack?: string): number | null {
  if (!stack) return null;
  const match = stack.match(/:(\d+):\d+/);
  return match ? parseInt(match[1]) : null;
}

function extractColumnNumber(stack?: string): number | null {
  if (!stack) return null;
  const match = stack.match(/:\d+:(\d+)/);
  return match ? parseInt(match[1]) : null;
}
