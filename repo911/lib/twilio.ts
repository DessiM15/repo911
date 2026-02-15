import twilio from 'twilio';

let _client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set');
    }
    _client = twilio(sid, token);
  }
  return _client;
}

// Lazy proxy — mirrors lib/resend.ts pattern
export const twilioClient = new Proxy({} as twilio.Twilio, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
