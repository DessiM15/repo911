import { twilioClient } from './twilio';

export async function sendSms(to: string, body: string) {
  try {
    await twilioClient.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body,
    });
  } catch (err) {
    console.error('[SMS] Failed to send:', err);
  }
}

interface SmsAttorney {
  sms_notifications: boolean;
  phone: string;
}

interface SmsLead {
  case_id?: string;
  id?: string;
  qualification_tier: string;
  state?: string;
  repo_state?: string;
}

export async function sendNewLeadSms(attorney: SmsAttorney, lead: SmsLead) {
  if (!attorney.sms_notifications || !attorney.phone) return;
  const tier = lead.qualification_tier.toUpperCase();
  const state = lead.repo_state || lead.state || 'Unknown';
  await sendSms(
    attorney.phone,
    `[Repo911] New ${tier} lead in ${state}. Log in to view: ${process.env.NEXT_PUBLIC_APP_URL}/attorney/marketplace`
  );
}

export async function sendLeadClaimedSms(attorney: SmsAttorney, lead: SmsLead) {
  if (!attorney.sms_notifications || !attorney.phone) return;
  const caseId = lead.case_id || lead.id || '';
  await sendSms(
    attorney.phone,
    `[Repo911] You claimed a lead (${caseId.substring(0, 8)}). View details: ${process.env.NEXT_PUBLIC_APP_URL}/attorney/my-leads`
  );
}
