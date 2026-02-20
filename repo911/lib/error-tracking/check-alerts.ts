/**
 * Shared alert rule checker for Repo911 error tracking.
 *
 * Used by both the server-side tracker and the client error API route
 * to evaluate alert rules after an error occurrence is recorded.
 */

import type { createAdminClient } from '@/lib/supabase/admin';

export async function checkAlertRules(
  supabase: ReturnType<typeof createAdminClient>,
  errorId: string,
): Promise<void> {
  const { data: rules } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true);

  if (!rules?.length) return;

  const { data: error } = await supabase
    .from('errors')
    .select('*')
    .eq('id', errorId)
    .single();

  if (!error) return;

  for (const rule of rules) {
    // Level match
    if (rule.error_level?.length && !rule.error_level.includes(error.level)) continue;

    // Type match
    if (rule.error_types?.length && !rule.error_types.includes(error.error_type)) continue;

    // Tag match
    if (rule.tags?.length) {
      const errorTags: string[] = error.tags || [];
      if (!rule.tags.some((t: string) => errorTags.includes(t))) continue;
    }

    // Cooldown: don't re-trigger within 15 minutes
    if (rule.last_triggered) {
      const elapsed = Date.now() - new Date(rule.last_triggered).getTime();
      if (elapsed < 15 * 60 * 1000) continue;
    }

    // Threshold check
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - (rule.time_window || 60));

    const { count } = await supabase
      .from('error_occurrences')
      .select('id', { count: 'exact', head: true })
      .eq('error_id', errorId)
      .gte('created_at', cutoff.toISOString());

    if ((count || 0) < (rule.threshold || 1)) continue;

    // Trigger alert via the alerts module (lazy-loaded to avoid circular deps)
    const { sendErrorAlert } = await import('./alerts');
    await sendErrorAlert(rule, error);

    // Mark triggered
    await supabase
      .from('alert_rules')
      .update({ last_triggered: new Date().toISOString() })
      .eq('id', rule.id);
  }
}
