import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { scrubPII } from '@/lib/error-tracking/scrubber';

// Simple in-memory rate limiter: max 30 error reports per IP per minute
const ipBuckets = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.reset) {
    ipBuckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  bucket.count++;
  return bucket.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
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
        return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
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

    return NextResponse.json({ success: true, errorId });
  } catch (error) {
    console.error('Error tracking API failed:', error);
    return NextResponse.json({ error: 'Failed to track error' }, { status: 500 });
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
