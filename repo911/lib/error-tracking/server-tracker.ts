/**
 * Server-side error tracker for Repo911.
 *
 * Uses createAdminClient() to bypass RLS. All calls are fire-and-forget
 * so they never block API responses.
 */

import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { scrubPII, scrubHeaders } from './scrubber';
import { checkAlertRules } from './check-alerts';
import type { ErrorLevel } from '@/types';

interface ServerErrorContext {
  level?: ErrorLevel;
  tags?: string[];
  extra?: Record<string, unknown>;
  userId?: string;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    query?: Record<string, unknown>;
  };
}

// ---------- Fingerprinting ----------

function generateFingerprint(error: Error): string {
  const firstStackLine = error.stack?.split('\n')[1]?.trim() || '';
  const signature = `${error.name}:${error.message}:${firstStackLine}`;
  return crypto.createHash('md5').update(signature).digest('hex');
}

function extractSourceFile(error: Error): string | null {
  const line = error.stack?.split('\n')[1];
  const match = line?.match(/\((.+?):\d+:\d+\)/) || line?.match(/at\s+(.+?):\d+:\d+/);
  return match?.[1] || null;
}

function extractLineNumber(error: Error): number | null {
  const line = error.stack?.split('\n')[1];
  const match = line?.match(/:(\d+):\d+/);
  return match ? parseInt(match[1]) : null;
}

// ---------- Core tracker ----------

async function trackError(error: Error, context?: ServerErrorContext): Promise<void> {
  try {
    const supabase = createAdminClient();
    const fingerprint = generateFingerprint(error);
    const scrubbedMessage = scrubPII(error.message) as string;
    const scrubbedStack = error.stack ? scrubPII(error.stack) as string : null;

    // Upsert: find existing error by fingerprint or create new
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
          error_type: error.name || 'Error',
          message: scrubbedMessage,
          platform: 'server',
          level: context?.level || 'error',
          tags: context?.tags || [],
          environment: process.env.NODE_ENV || 'production',
        })
        .select('id')
        .single();

      if (insertError || !newError) {
        console.error('Error tracker: failed to insert error:', insertError?.message);
        return;
      }
      errorId = newError.id;
    }

    // Create occurrence record
    await supabase.from('error_occurrences').insert({
      error_id: errorId,
      stack_trace: scrubbedStack,
      source_file: extractSourceFile(error),
      line_number: extractLineNumber(error),
      user_id: context?.userId || null,
      url: context?.request?.url || null,
      http_method: context?.request?.method || null,
      query_params: context?.request?.query ? scrubPII(context.request.query) : null,
      request_headers: scrubHeaders(context?.request?.headers),
      extra_data: context?.extra ? scrubPII(context.extra) : {},
    });

    // Check alert rules (fire-and-forget)
    checkAlertRules(supabase, errorId).catch(() => {});
  } catch (err) {
    // Never let the tracker itself throw
    console.error('Error tracker failed:', err);
  }
}

// ---------- Public API ----------

/**
 * Fire-and-forget: capture a server-side exception.
 * Never blocks the caller. Safe to call without await.
 */
export function captureServerException(error: Error, context?: ServerErrorContext): void {
  trackError(error, context).catch(() => {});
}

/**
 * Fire-and-forget: capture a message as an error event.
 */
export function captureServerMessage(
  message: string,
  level: ErrorLevel = 'info',
  context?: Omit<ServerErrorContext, 'level'>,
): void {
  const err = new Error(message);
  err.name = 'Message';
  trackError(err, { ...context, level }).catch(() => {});
}
