import type { LeadSubmission, QualificationBreakdown, QualificationTier } from '@/types';

export interface QualificationResult {
  score: number;
  tier: QualificationTier;
  breakdown: QualificationBreakdown;
}

export function qualifyLead(data: LeadSubmission): QualificationResult {
  const details: string[] = [];
  let breachOfPeace = 0;
  let belongings = 0;
  let military = 0;
  let fdcpa = 0;
  let notice = 0;
  let evidence = 0;
  let penalties = 0;

  // ===== BREACH OF PEACE INDICATORS (Primary — Highest Value) =====

  // Consumer objected AND repo agent continued: +40
  if (data.verbally_objected === 'yes' && data.continued_after_objection === 'yes') {
    breachOfPeace += 40;
    details.push('Consumer objected and repo agent continued (+40)');
  } else if (data.verbally_objected === 'yes') {
    // Consumer objected verbally (regardless of outcome): +15
    breachOfPeace += 15;
    details.push('Consumer verbally objected (+15)');
  }

  // Repo agent used physical force or threats: +35
  if (data.physical_force_or_threats) {
    breachOfPeace += 35;
    details.push('Physical force or threats used (+35)');
  }

  // Repo agent entered locked/gated area without permission: +30
  if (data.entered_locked_area) {
    breachOfPeace += 30;
    details.push('Entered locked/gated area without permission (+30)');
  }

  // Police assisted with the repossession: +30
  if (data.police_present && data.police_assisted === 'yes') {
    breachOfPeace += 30;
    details.push('Police assisted with civil repossession (+30)');
  }

  // Repo agent caused property damage: +25
  if (data.property_damage) {
    breachOfPeace += 25;
    details.push('Property damage during repossession (+25)');
  }

  // Excessive noise / public disturbance: +15
  if (data.excessive_noise) {
    breachOfPeace += 15;
    details.push('Excessive noise or public disturbance (+15)');
  }

  // Repossession at workplace: +10
  if (data.repo_at_workplace) {
    breachOfPeace += 10;
    details.push('Repossession at workplace (+10)');
  }

  // Public embarrassment / humiliation: +10
  if (data.public_embarrassment) {
    breachOfPeace += 10;
    details.push('Public embarrassment or humiliation (+10)');
  }

  // ===== PERSONAL BELONGINGS VIOLATIONS =====

  // Belongings not returned: +20
  if (data.had_belongings && (data.belongings_returned === 'no' || data.belongings_returned === 'some')) {
    belongings += 20;
    details.push('Personal belongings not fully returned (+20)');
  }

  // Charged a fee to retrieve belongings: +25
  if (data.charged_fee_for_belongings) {
    belongings += 25;
    details.push('Charged fee to retrieve belongings (+25)');
  }

  // High value belongings unreturned (>$500): +10
  if (
    data.had_belongings &&
    data.belongings_returned !== 'yes' &&
    data.belongings_value &&
    data.belongings_value > 500
  ) {
    belongings += 10;
    details.push('High-value belongings unreturned >$500 (+10)');
  }

  // ===== MILITARY / SCRA VIOLATIONS =====

  // On active duty at time of repo: +40
  if (data.military_service && data.active_duty_at_repo) {
    military += 40;
    details.push('On active duty at time of repossession — SCRA violation (+40)');
  }

  // Loan originated before active duty: +10 additional
  if (
    data.military_service &&
    data.active_duty_at_repo &&
    data.loan_before_active_duty === 'yes'
  ) {
    military += 10;
    details.push('Loan originated before active duty (+10)');
  }

  // ===== FDCPA VIOLATIONS (Debt Collection) =====

  const fdcpaViolationCount = data.fdcpa_violations?.length ?? 0;

  if (data.debt_collector_contact && fdcpaViolationCount > 0) {
    // Each FDCPA violation: +10 each
    fdcpa += fdcpaViolationCount * 10;
    details.push(`${fdcpaViolationCount} FDCPA violation(s) (+${fdcpaViolationCount * 10})`);

    // 3+ FDCPA violations: +15 bonus
    if (fdcpaViolationCount >= 3) {
      fdcpa += 15;
      details.push('3+ FDCPA violations bonus (+15)');
    }
  }

  // ===== NOTICE & PROCESS VIOLATIONS =====

  // No written notice before repossession: +10
  if (data.received_written_notice === 'no') {
    notice += 10;
    details.push('No written notice before repossession (+10)');
  }

  // No Notice of Sale received: +10
  if (data.received_notice_of_sale === 'no') {
    notice += 10;
    details.push('No Notice of Sale received (+10)');
  }

  // ===== SUPPORTING EVIDENCE =====

  // Has photos/videos: +10
  if (data.has_photos_videos) {
    evidence += 10;
    details.push('Has photos/videos of repossession (+10)');
  }

  // Has documents: +5
  if (data.has_documents) {
    evidence += 5;
    details.push('Has supporting documents (+5)');
  }

  // Has witnesses: +10
  if (data.has_witnesses) {
    evidence += 10;
    details.push('Has witnesses (+10)');
  }

  // ===== NEGATIVE / DISQUALIFYING FACTORS =====

  // Repossession occurred more than 2 years ago: -50
  if (data.repo_date) {
    const repoDate = new Date(data.repo_date);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    if (repoDate < twoYearsAgo) {
      penalties -= 50;
      details.push('Repossession more than 2 years ago — possible statute of limitations (-50)');
    }
  }

  // Calculate total score
  const rawScore = breachOfPeace + belongings + military + fdcpa + notice + evidence + penalties;
  const score = Math.max(0, rawScore);

  // Check for disqualification
  const hasNoIndicators =
    breachOfPeace === 0 && belongings === 0 && military === 0 && fdcpa === 0;

  let tier: QualificationTier;
  if (hasNoIndicators) {
    tier = 'disqualified';
    details.push('No qualifying violation indicators found — disqualified');
  } else if (score >= 60) {
    tier = 'hot';
  } else if (score >= 30) {
    tier = 'warm';
  } else if (score >= 10) {
    tier = 'cold';
  } else {
    tier = 'disqualified';
  }

  return {
    score,
    tier,
    breakdown: {
      breach_of_peace: breachOfPeace,
      belongings,
      military,
      fdcpa,
      notice,
      evidence,
      penalties,
      details,
    },
  };
}
