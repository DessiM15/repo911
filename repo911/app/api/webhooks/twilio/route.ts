import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import twilio from 'twilio';

const STOP_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];

export async function POST(request: NextRequest) {
  try {
    // Verify Twilio signature
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      console.error('[Twilio Webhook] TWILIO_AUTH_TOKEN not set');
      return new NextResponse('<Response/>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    const signature = request.headers.get('x-twilio-signature') || '';
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;
    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body));

    const isValid = twilio.validateRequest(authToken, signature, url, params);
    if (!isValid) {
      console.error('[Twilio Webhook] Invalid signature');
      return new NextResponse('<Response/>', { status: 403, headers: { 'Content-Type': 'text/xml' } });
    }

    const messageBody = (params.Body || '').trim().toLowerCase();
    const from = params.From || '';

    if (!from || !STOP_KEYWORDS.includes(messageBody)) {
      // Not a STOP message — return empty TwiML
      return new NextResponse('<Response/>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    // Opt out: set sms_notifications = false for all leads matching this phone
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('leads')
      .update({ sms_notifications: false })
      .eq('phone', from);

    if (error) {
      console.error('[Twilio Webhook] Failed to opt out:', error);
    }

    return new NextResponse('<Response/>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error('[Twilio Webhook] Error:', error);
    return new NextResponse('<Response/>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
  }
}
