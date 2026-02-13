/**
 * Error alert system for Repo911.
 *
 * Uses the existing Resend email infrastructure to send alerts
 * when error thresholds are met.
 */

import { resend, EMAIL_FROM } from '@/lib/resend';
import type { AlertRule, TrackedError } from '@/types';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Repo911';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://repo911.com';

export async function sendErrorAlert(rule: AlertRule, error: TrackedError): Promise<void> {
  const emails = rule.notification_channels?.email;

  // Fall back to ADMIN_NOTIFICATION_EMAIL or EMAIL_FROM
  const recipients = emails?.length
    ? emails
    : (process.env.ADMIN_NOTIFICATION_EMAIL || EMAIL_FROM).split(',').map((e) => e.trim());

  if (!recipients.length) return;

  const levelColor =
    error.level === 'fatal' ? '#dc2626'
    : error.level === 'error' ? '#ea580c'
    : error.level === 'warning' ? '#ca8a04'
    : '#2563eb';

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject: `[${error.level.toUpperCase()}] ${error.error_type}: ${error.message.substring(0, 80)}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f7f7f7;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="background:#1B2A4A;padding:24px 32px;">
<h1 style="margin:0;font-size:22px;color:#ffffff;">${APP_NAME} — Error Alert</h1>
</td></tr>
<tr><td style="padding:32px;">
<div style="display:inline-block;padding:4px 12px;border-radius:4px;background:${levelColor};color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">
${error.level}
</div>
<h2 style="margin:8px 0 4px;font-size:18px;color:#111827;">${escapeHtml(error.error_type)}</h2>
<p style="margin:0 0 20px;font-size:14px;color:#6b7280;word-break:break-word;">${escapeHtml(error.message)}</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;width:140px;font-size:13px;">Occurrences</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${error.occurrence_count}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">First Seen</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${new Date(error.first_seen).toLocaleString()}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Last Seen</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${new Date(error.last_seen).toLocaleString()}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Environment</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${error.environment}</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Platform</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${error.platform || '—'}</td></tr>
${error.tags?.length ? `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;font-size:13px;">Tags</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;">${(error.tags as string[]).join(', ')}</td></tr>` : ''}
</table>
<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
<a href="${APP_URL}/admin/errors" style="display:inline-block;padding:12px 24px;background:#4A90D9;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">View in Dashboard</a>
</td></tr></table>
<p style="margin:0;font-size:13px;color:#9ca3af;">Alert rule: ${escapeHtml(rule.name)}</p>
</td></tr>
<tr><td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">&copy; ${new Date().getFullYear()} ${APP_NAME}. Automated error alert.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
    });
  } catch (err) {
    console.error('Failed to send error alert email:', err);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
