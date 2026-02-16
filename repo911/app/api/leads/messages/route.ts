import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { consumerMessageSchema } from '@/lib/validations/consumer';
import { sendConsumerMessageNotification } from '@/lib/emails';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 30 per IP per 60 seconds
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`consumer-messages-get:${ip}`, { limit: 30, windowSeconds: 60 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many requests. Please try again later.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const email = request.nextUrl.searchParams.get('email');
    const leadId = request.nextUrl.searchParams.get('leadId');

    if (!email || !leadId) {
      return apiError('Email and lead ID are required', 400);
    }

    const supabase = createAdminClient();

    // Verify email+leadId match
    const { data: lead } = await supabase
      .from('leads')
      .select('id, claimed_by')
      .eq('id', leadId)
      .eq('email', email)
      .single();

    if (!lead) {
      return apiError('Case not found', 404);
    }

    if (!lead.claimed_by) {
      return apiError('Case has not been claimed by an attorney yet', 400);
    }

    // Fetch messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, created_at, sender_type, content, read')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    return apiSuccess({ messages: messages || [] });
  } catch (error) {
    console.error('Consumer messages GET error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 per IP per 15 minutes
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimitResult = rateLimit(`consumer_message:${ip}`, { limit: 10, windowSeconds: 900 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many messages. Please wait before sending another.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const body = await request.json();
    const parsed = consumerMessageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    const { email, leadId, content } = parsed.data;

    const supabase = createAdminClient();

    // Verify email+leadId match and lead is claimed
    const { data: lead } = await supabase
      .from('leads')
      .select('id, claimed_by, first_name')
      .eq('id', leadId)
      .eq('email', email)
      .single();

    if (!lead) {
      return apiError('Case not found', 404);
    }

    if (!lead.claimed_by) {
      return apiError('Case has not been claimed by an attorney yet', 400);
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        lead_id: leadId,
        sender_type: 'consumer',
        sender_id: null,
        content,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Message insert error:', insertError);
      return apiError('Failed to send message', 500);
    }

    // Create notification for attorney
    await supabase.from('notifications').insert({
      recipient_type: 'attorney',
      recipient_id: lead.claimed_by,
      title: 'New Message from Consumer',
      message: `${lead.first_name} sent you a message regarding their case.`,
      type: 'system',
      link: `/attorney/my-leads/${leadId}`,
    });

    // Send email to attorney (fire-and-forget)
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('email, first_name')
      .eq('id', lead.claimed_by)
      .single();

    if (attorney) {
      sendConsumerMessageNotification({
        to: attorney.email,
        attorneyName: attorney.first_name,
        consumerName: lead.first_name,
        leadId,
      }).catch(() => { /* non-critical */ });
    }

    return apiSuccess({ id: message.id, created_at: message.created_at });
  } catch (error) {
    console.error('Consumer message POST error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
