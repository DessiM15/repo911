import { resend, EMAIL_FROM } from './resend';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Repo911';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';

// ============================================================
// Shared helpers
// ============================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f7f7f7;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
<!-- Header -->
<tr><td style="background:#1B2A4A;padding:24px 32px;">
<h1 style="margin:0;font-size:22px;color:#ffffff;">
${APP_NAME}
</h1>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h2>
${body}
</td></tr>
<!-- Footer -->
<tr><td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
This is not legal advice. ${APP_NAME} is a lead generation service, not a law firm.
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`;
}

function btn(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
<a href="${url}" style="display:inline-block;padding:12px 24px;background:#3474BA;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${label}</a>
</td></tr></table>`;
}

// ============================================================
// Email functions
// ============================================================

/**
 * Sent to the consumer after lead submission.
 */
export async function sendLeadSubmissionConfirmation(opts: {
  to: string;
  firstName: string;
  tier: string;
  score: number;
}) {
  const tierText = opts.tier === 'hot'
    ? 'Our initial review indicates a <strong>strong potential case</strong>.'
    : opts.tier === 'warm'
    ? 'Our initial review indicates a <strong>potential case</strong> worth exploring.'
    : opts.tier === 'cold'
    ? 'Our initial review suggests there <strong>may be some grounds</strong> for a case.'
    : 'Based on the information provided, your case <strong>did not meet our qualification criteria</strong> at this time.';

  const html = wrap('Thank You for Submitting Your Case', [
    p(`Hi ${escapeHtml(opts.firstName)},`),
    p(`Thank you for submitting your case to ${APP_NAME}. We&apos;re reviewing your information.`),
    p(tierText),
    opts.tier !== 'disqualified'
      ? p('A licensed attorney in your area may be reaching out to you soon. Please keep your phone and email accessible.')
      : p('While your case did not meet our current criteria, we encourage you to consult with a local attorney for a more detailed review.'),
    p('If you have any questions, please don&apos;t hesitate to reach out.'),
    p(`&mdash; The ${APP_NAME} Team`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: `Your Case Has Been Submitted — ${APP_NAME}`,
    html,
  });
}

/**
 * Sent to matching active attorneys when a hot lead is submitted.
 */
export async function sendHotLeadAlert(opts: {
  to: string;
  attorneyName: string;
  state: string;
  violationTypes: string[];
}) {
  const violations = opts.violationTypes.length > 0
    ? opts.violationTypes.join(', ')
    : 'Multiple potential violations';

  const html = wrap('New Hot Lead Available', [
    p(`Hi ${escapeHtml(opts.attorneyName)},`),
    p(`A new <strong style="color:#dc2626;">HOT</strong> lead is available in <strong>${escapeHtml(opts.state)}</strong>.`),
    p(`<strong>Violation types:</strong> ${escapeHtml(violations)}`),
    p('This lead has a high qualification score. Claim it before another attorney does.'),
    btn('View in Marketplace', `${APP_URL}/attorney/marketplace`),
    p(`&mdash; The ${APP_NAME} Team`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: `New Hot Lead in ${opts.state} — ${APP_NAME}`,
    html,
  });
}

/**
 * Sent to matching active attorneys when a warm lead is submitted.
 */
export async function sendWarmLeadAlert(opts: {
  to: string;
  attorneyName: string;
  state: string;
}) {
  const html = wrap('New Lead Available', [
    p(`Hi ${escapeHtml(opts.attorneyName)},`),
    p(`A new lead is available in <strong>${escapeHtml(opts.state)}</strong>.`),
    p('Check the marketplace for details and claim it if it matches your practice areas.'),
    btn('View in Marketplace', `${APP_URL}/attorney/marketplace`),
    p(`&mdash; The ${APP_NAME} Team`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: `New Lead in ${opts.state} — ${APP_NAME}`,
    html,
  });
}

/**
 * Sent to consumer when their lead is claimed by an attorney.
 */
export async function sendLeadClaimedToConsumer(opts: {
  to: string;
  firstName: string;
}) {
  const html = wrap('Great News — An Attorney Is Reviewing Your Case', [
    p(`Hi ${escapeHtml(opts.firstName)},`),
    p('Great news! A licensed attorney has reviewed your case and will be reaching out to you soon.'),
    p('Here\'s what to expect:'),
    p('&bull; The attorney may call or email you within the next 24&ndash;48 hours.<br/>&bull; Have any relevant documents ready (repo notice, loan agreement, photos/videos).<br/>&bull; The initial consultation is typically free.'),
    p('If you don\'t hear from the attorney within a few days, please let us know.'),
    p(`&mdash; The ${APP_NAME} Team`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: `An Attorney Is Ready to Help — ${APP_NAME}`,
    html,
  });
}

/**
 * Sent to the attorney after they successfully claim a lead.
 */
export async function sendLeadClaimedToAttorney(opts: {
  to: string;
  attorneyName: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadState: string;
  tier: string;
  amount: number;
}) {
  const html = wrap('Lead Claimed — Full Details Unlocked', [
    p(`Hi ${escapeHtml(opts.attorneyName)},`),
    p(`You have successfully claimed a <strong>${escapeHtml(opts.tier.toUpperCase())}</strong> lead. Here are the full contact details:`),
    `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;width:120px;">Name</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.leadName)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Email</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.leadEmail)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Phone</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.leadPhone)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">State</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.leadState)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Payment</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">$${(opts.amount / 100).toFixed(2)}</td></tr>
    </table>`,
    p('You can view the full lead details including the case narrative, qualification breakdown, and evidence in your portal.'),
    btn('View My Leads', `${APP_URL}/attorney/my-leads`),
    p(`&mdash; The ${APP_NAME} Team`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: `Lead Claimed — Contact Info Unlocked — ${APP_NAME}`,
    html,
  });
}

/**
 * Sent to admin when a new attorney registers.
 */
/**
 * Sent to attorney when a consumer sends a message.
 */
export async function sendConsumerMessageNotification(opts: {
  to: string;
  attorneyName: string;
  consumerName: string;
  leadId: string;
}) {
  const html = wrap('New Message from Consumer', [
    p(`Hi ${escapeHtml(opts.attorneyName)},`),
    p(`<strong>${escapeHtml(opts.consumerName)}</strong> has sent you a new message regarding their case.`),
    p('Log in to your portal to view and reply to the message.'),
    btn('View Messages', `${APP_URL}/attorney/my-leads/${opts.leadId}`),
    p(`&mdash; The ${APP_NAME} Team`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: `New Message from ${opts.consumerName} — ${APP_NAME}`,
    html,
  });
}

/**
 * Sent to consumer when an attorney sends a message.
 */
export async function sendAttorneyMessageToConsumer(opts: {
  to: string;
  consumerName: string;
  attorneyName: string;
  messageContent: string;
  leadId: string;
}) {
  const html = wrap('New Message from Your Attorney', [
    p(`Hi ${escapeHtml(opts.consumerName)},`),
    p(`<strong>${escapeHtml(opts.attorneyName)}</strong> sent you a message:`),
    `<div style="margin:16px 0;padding:16px;background:#f3f4f6;border-radius:8px;border-left:4px solid #3474BA;">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;white-space:pre-wrap;">${escapeHtml(opts.messageContent)}</p>
    </div>`,
    p('You can reply to this message by visiting your case tracking page.'),
    btn('Reply to Message', `${APP_URL}/track?id=${opts.leadId}`),
    p(`&mdash; The ${APP_NAME} Team`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: opts.to,
    subject: `Message from Your Attorney — ${APP_NAME}`,
    html,
  });
}

/**
 * Sent to admin when a new attorney registers.
 */
export async function sendAttorneyRegistrationAlert(opts: {
  attorneyName: string;
  email: string;
  barState: string;
  firmName: string | null;
}) {
  const adminEmailRaw = process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM;
  const adminEmail = adminEmailRaw.includes(',')
    ? adminEmailRaw.split(',').map(e => e.trim())
    : adminEmailRaw;

  const html = wrap('New Attorney Registration', [
    p('A new attorney has registered on the platform:'),
    `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;width:120px;">Name</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.attorneyName)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Email</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.email)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Bar State</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.barState)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">Firm</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(opts.firmName || 'N/A')}</td></tr>
    </table>`,
    p('Review and approve this attorney in the admin portal.'),
    btn('View Attorneys', `${APP_URL}/admin/attorneys`),
    p(`&mdash; ${APP_NAME} System`),
  ].join(''));

  return resend.emails.send({
    from: EMAIL_FROM,
    to: adminEmail,
    subject: `New Attorney Registration: ${opts.attorneyName} — ${APP_NAME}`,
    html,
  });
}


