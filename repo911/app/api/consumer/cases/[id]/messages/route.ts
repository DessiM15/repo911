import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { sendConsumerMessageNotification } from '@/lib/emails';
import { apiSuccess, apiError } from '@/lib/api-response';

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Authentication required', 401);
    }

    // Rate limit: 10 per user per 15 minutes
    const rl = rateLimit(`consumer_message:${user.id}`, { limit: 10, windowSeconds: 900 });
    if (!rl.success) {
      return apiError('Too many messages. Please wait before sending another.', 429, undefined, {
        'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
      });
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten());
    }

    // Verify lead ownership via RLS + check claimed
    const { data: lead } = await supabase
      .from('leads')
      .select('id, claimed_by, first_name')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return apiError('Case not found', 404);
    }

    if (!lead.claimed_by) {
      return apiError('Case has not been claimed by an attorney yet', 400);
    }

    // Insert message via server client (RLS policy allows consumer inserts)
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        lead_id: leadId,
        sender_type: 'consumer',
        sender_id: null,
        content: parsed.data.content,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Consumer message insert error:', insertError);
      return apiError('Failed to send message', 500);
    }

    // Notification + email via admin client (no consumer RLS on notifications)
    const admin = createAdminClient();

    await admin.from('notifications').insert({
      recipient_type: 'attorney',
      recipient_id: lead.claimed_by,
      title: 'New Message from Consumer',
      message: `${lead.first_name} sent you a message regarding their case.`,
      type: 'system',
      link: `/attorney/my-leads/${leadId}`,
    });

    const { data: attorney } = await admin
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
      }).catch(() => {
        /* non-critical */
      });
    }

    return apiSuccess({ id: message.id, created_at: message.created_at });
  } catch (error) {
    console.error('Consumer message POST error:', error);
    return apiError('An unexpected error occurred', 500);
  }
}
