import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { attorneyMessageSchema } from '@/lib/validations/attorney';
import { sendAttorneyMessageToConsumer } from '@/lib/emails';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
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
      return apiError('Attorney not found', 404);
    }

    // Verify lead ownership
    const { data: lead } = await supabase
      .from('leads')
      .select('id, claimed_by')
      .eq('id', leadId)
      .eq('claimed_by', attorney.id)
      .single();

    if (!lead) {
      return apiError('Lead not found or not owned by you', 404);
    }

    const adminSupabase = createAdminClient();

    // Fetch messages
    const { data: messages } = await adminSupabase
      .from('messages')
      .select('id, created_at, sender_type, content, read')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    // Mark consumer messages as read
    await adminSupabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('lead_id', leadId)
      .eq('sender_type', 'consumer')
      .eq('read', false);

    return apiSuccess({ messages: messages || [] });
  } catch (error) {
    console.error('Attorney messages GET error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return apiError('Unauthorized', 401);
    }

    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id, first_name, last_name')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      return apiError('Attorney not found', 404);
    }

    // Rate limit: 30 per attorney per hour
    const rateLimitResult = rateLimit(`attorney_message:${attorney.id}`, { limit: 30, windowSeconds: 3600 });
    if (!rateLimitResult.success) {
      return apiError(
        'Too many messages. Please wait before sending another.',
        429,
        undefined,
        { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() }
      );
    }

    const body = await request.json();
    const parsed = attorneyMessageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    // Verify lead ownership
    const { data: lead } = await supabase
      .from('leads')
      .select('id, claimed_by, email, first_name')
      .eq('id', leadId)
      .eq('claimed_by', attorney.id)
      .single();

    if (!lead) {
      return apiError('Lead not found or not owned by you', 404);
    }

    const adminSupabase = createAdminClient();

    // Insert message
    const { data: message, error: insertError } = await adminSupabase
      .from('messages')
      .insert({
        lead_id: leadId,
        sender_type: 'attorney',
        sender_id: attorney.id,
        content: parsed.data.content,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Message insert error:', insertError);
      return apiError('Failed to send message', 500);
    }

    // Send email to consumer (fire-and-forget)
    sendAttorneyMessageToConsumer({
      to: lead.email,
      consumerName: lead.first_name,
      attorneyName: `${attorney.first_name} ${attorney.last_name}`,
      messageContent: parsed.data.content,
      leadId,
    }).catch(() => { /* non-critical */ });

    return apiSuccess({ id: message.id, created_at: message.created_at });
  } catch (error) {
    console.error('Attorney message POST error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
