import { createAdminClient } from '@/lib/supabase/admin';
import { sendHotLeadAlert, sendWarmLeadAlert } from '@/lib/emails';
import { sendNewLeadSms } from '@/lib/sms';
import type { QualificationBreakdown } from '@/types';

/**
 * Notify matching active attorneys about a new qualified lead.
 * Extracted from the lead submission route so it can be called
 * both at submission time (for backwards-compat) and after email
 * verification.
 */
export async function notifyMatchingAttorneys(opts: {
  tier: string;
  repoState: string;
  qualificationBreakdown: QualificationBreakdown;
}) {
  const { tier, repoState, qualificationBreakdown } = opts;

  if (tier !== 'hot' && tier !== 'warm') return;

  const violationTypes: string[] = [];
  if (qualificationBreakdown.breach_of_peace > 0) violationTypes.push('Breach of Peace');
  if (qualificationBreakdown.belongings > 0) violationTypes.push('Property/Belongings');
  if (qualificationBreakdown.military > 0) violationTypes.push('SCRA/Military');
  if (qualificationBreakdown.fdcpa > 0) violationTypes.push('FDCPA');

  const supabase = createAdminClient();

  const { data: matchingAttorneys } = await supabase
    .from('attorneys')
    .select('id, first_name, email, phone, preferred_states, email_notifications, sms_notifications')
    .eq('status', 'active');

  const attorneys = (matchingAttorneys || []).filter(
    (a) => !a.preferred_states || a.preferred_states.length === 0 || a.preferred_states.includes(repoState)
  );

  for (const atty of attorneys) {
    if (atty.email_notifications) {
      if (tier === 'hot') {
        sendHotLeadAlert({
          to: atty.email,
          attorneyName: atty.first_name,
          state: repoState,
          violationTypes,
        }).catch(() => { /* non-critical */ });
      } else {
        sendWarmLeadAlert({
          to: atty.email,
          attorneyName: atty.first_name,
          state: repoState,
        }).catch(() => { /* non-critical */ });
      }
    }

    if (atty.sms_notifications && atty.phone) {
      sendNewLeadSms(
        { sms_notifications: true, phone: atty.phone },
        { qualification_tier: tier, repo_state: repoState }
      ).catch(() => { /* non-critical */ });
    }
  }
}
