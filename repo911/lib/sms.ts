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

// ---------- Consumer SMS ----------

interface SmsConsumer {
  phone: string;
  preferred_contact: string | null;
  sms_notifications?: boolean;
}

function shouldSendConsumerSms(consumer: SmsConsumer): boolean {
  if (!consumer.phone) return false;
  if (consumer.sms_notifications === false) return false;
  if (consumer.preferred_contact !== 'text' && consumer.preferred_contact !== 'phone') return false;
  return true;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function sendSubmissionConfirmationSms(consumer: SmsConsumer, leadId: string) {
  if (!shouldSendConsumerSms(consumer)) return;
  const caseId = leadId.substring(0, 8);
  await sendSms(
    consumer.phone,
    `Repo911: Case ${caseId} submitted. We're matching you with an attorney. Track: ${APP_URL}/track?id=${leadId} Reply STOP to opt out`
  );
}

export async function sendCaseClaimedSms(consumer: SmsConsumer, leadId: string, attorneyName: string) {
  if (!shouldSendConsumerSms(consumer)) return;
  const caseId = leadId.substring(0, 8);
  await sendSms(
    consumer.phone,
    `Repo911: Attorney ${attorneyName} has taken your case ${caseId}. View: ${APP_URL}/portal/dashboard`
  );
}

export async function sendStatusUpdateSms(consumer: SmsConsumer, leadId: string, newStatus: string) {
  if (!shouldSendConsumerSms(consumer)) return;
  const caseId = leadId.substring(0, 8);
  await sendSms(
    consumer.phone,
    `Repo911: Case ${caseId} status: ${newStatus}. Details: ${APP_URL}/portal/dashboard`
  );
}

export async function sendNewMessageSms(consumer: SmsConsumer, leadId: string, attorneyName: string) {
  if (!shouldSendConsumerSms(consumer)) return;
  const caseId = leadId.substring(0, 8);
  await sendSms(
    consumer.phone,
    `Repo911: New message from ${attorneyName} on case ${caseId}. View: ${APP_URL}/portal/dashboard`
  );
}

export async function sendSettlementUpdateSms(consumer: SmsConsumer, leadId: string, amount: number) {
  if (!shouldSendConsumerSms(consumer)) return;
  const caseId = leadId.substring(0, 8);
  await sendSms(
    consumer.phone,
    `Repo911: Settlement of $${amount.toLocaleString()} recorded for case ${caseId}. Details: ${APP_URL}/portal/dashboard`
  );
}
