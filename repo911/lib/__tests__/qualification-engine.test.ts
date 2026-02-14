import { describe, it, expect } from 'vitest';
import { qualifyLead } from '../qualification-engine';
import type { LeadSubmission } from '@/types';

/** Returns a minimal valid LeadSubmission with all violation indicators off. */
function baseSubmission(overrides: Partial<LeadSubmission> = {}): LeadSubmission {
  return {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '5551234567',
    preferred_contact: 'email',
    street_address: '123 Main St',
    city: 'Anytown',
    state: 'TX',
    zip_code: '75001',
    vehicle_year: 2020,
    vehicle_make: 'Toyota',
    vehicle_model: 'Camry',
    lease_or_finance: 'financed',
    lender_name: 'Ally Financial',
    behind_on_payments: 'yes',
    received_written_notice: 'yes',
    repo_date: new Date().toISOString().split('T')[0], // recent date
    repo_time_of_day: 'morning',
    repo_location: ['driveway'],
    repo_state: 'TX',
    verbally_objected: 'no',
    physical_force_or_threats: false,
    excessive_noise: false,
    entered_locked_area: false,
    property_damage: false,
    police_present: false,
    repo_at_workplace: false,
    public_embarrassment: false,
    narrative: 'Test narrative.',
    had_belongings: false,
    received_notice_of_sale: 'yes',
    deficiency_balance_contact: 'no',
    military_service: false,
    debt_collector_contact: false,
    has_photos_videos: false,
    has_documents: false,
    has_witnesses: false,
    electronic_signature: 'John Doe',
    consent_accurate_info: true,
    consent_not_legal_advice: true,
    consent_contact: true,
    consent_privacy_policy: true,
    ...overrides,
  };
}

// ===== Tier thresholds =====

describe('tier thresholds', () => {
  it('scores >= 60 → hot', () => {
    // verbal objected+continued(40) + physical force(35) = 75
    const result = qualifyLead(baseSubmission({
      verbally_objected: 'yes',
      continued_after_objection: 'yes',
      physical_force_or_threats: true,
    }));
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.tier).toBe('hot');
  });

  it('scores >= 30 and < 60 → warm', () => {
    // verbal objected+continued(40) = 40
    const result = qualifyLead(baseSubmission({
      verbally_objected: 'yes',
      continued_after_objection: 'yes',
    }));
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.score).toBeLessThan(60);
    expect(result.tier).toBe('warm');
  });

  it('scores >= 10 and < 30 → cold', () => {
    // verbal objection only(15) = 15
    const result = qualifyLead(baseSubmission({
      verbally_objected: 'yes',
    }));
    expect(result.score).toBeGreaterThanOrEqual(10);
    expect(result.score).toBeLessThan(30);
    expect(result.tier).toBe('cold');
  });

  it('scores < 10 with no indicators → disqualified', () => {
    const result = qualifyLead(baseSubmission());
    expect(result.tier).toBe('disqualified');
  });
});

// ===== Disqualification =====

describe('disqualification', () => {
  it('disqualifies when no breach/belongings/military/fdcpa indicators even if notice+evidence score > 0', () => {
    const result = qualifyLead(baseSubmission({
      received_written_notice: 'no',  // +10 notice
      received_notice_of_sale: 'no',  // +10 notice
      has_photos_videos: true,        // +10 evidence
    }));
    // Score is 30 from notice+evidence but no primary indicators
    expect(result.tier).toBe('disqualified');
  });
});

// ===== Breach of peace scoring =====

describe('breach of peace', () => {
  it('verbal objection only → +15', () => {
    const result = qualifyLead(baseSubmission({ verbally_objected: 'yes' }));
    expect(result.breakdown.breach_of_peace).toBe(15);
  });

  it('objection + continued → +40 (mutually exclusive with verbal-only)', () => {
    const result = qualifyLead(baseSubmission({
      verbally_objected: 'yes',
      continued_after_objection: 'yes',
    }));
    expect(result.breakdown.breach_of_peace).toBe(40);
  });

  it('physical force or threats → +35', () => {
    const result = qualifyLead(baseSubmission({ physical_force_or_threats: true }));
    expect(result.breakdown.breach_of_peace).toBe(35);
  });

  it('entered locked area → +30', () => {
    const result = qualifyLead(baseSubmission({ entered_locked_area: true }));
    expect(result.breakdown.breach_of_peace).toBe(30);
  });

  it('police assisted → +30', () => {
    const result = qualifyLead(baseSubmission({
      police_present: true,
      police_assisted: 'yes',
    }));
    expect(result.breakdown.breach_of_peace).toBe(30);
  });

  it('police present but did not assist → 0', () => {
    const result = qualifyLead(baseSubmission({
      police_present: true,
      police_assisted: 'no',
    }));
    expect(result.breakdown.breach_of_peace).toBe(0);
  });

  it('property damage → +25', () => {
    const result = qualifyLead(baseSubmission({ property_damage: true }));
    expect(result.breakdown.breach_of_peace).toBe(25);
  });

  it('excessive noise → +15', () => {
    const result = qualifyLead(baseSubmission({ excessive_noise: true }));
    expect(result.breakdown.breach_of_peace).toBe(15);
  });

  it('repo at workplace → +10', () => {
    const result = qualifyLead(baseSubmission({ repo_at_workplace: true }));
    expect(result.breakdown.breach_of_peace).toBe(10);
  });

  it('public embarrassment → +10', () => {
    const result = qualifyLead(baseSubmission({ public_embarrassment: true }));
    expect(result.breakdown.breach_of_peace).toBe(10);
  });
});

// ===== Belongings =====

describe('belongings', () => {
  it('belongings not returned → +20', () => {
    const result = qualifyLead(baseSubmission({
      had_belongings: true,
      belongings_returned: 'no',
    }));
    expect(result.breakdown.belongings).toBe(20);
  });

  it('belongings partially returned → +20', () => {
    const result = qualifyLead(baseSubmission({
      had_belongings: true,
      belongings_returned: 'some',
    }));
    expect(result.breakdown.belongings).toBe(20);
  });

  it('charged fee for belongings → +25', () => {
    const result = qualifyLead(baseSubmission({
      had_belongings: true,
      belongings_returned: 'yes',
      charged_fee_for_belongings: true,
    }));
    expect(result.breakdown.belongings).toBe(25);
  });

  it('high-value belongings > $500 unreturned → +10 additional', () => {
    const result = qualifyLead(baseSubmission({
      had_belongings: true,
      belongings_returned: 'no',
      belongings_value: 600,
    }));
    // 20 (not returned) + 10 (high value) = 30
    expect(result.breakdown.belongings).toBe(30);
  });

  it('high-value belongings at exactly $500 → no bonus', () => {
    const result = qualifyLead(baseSubmission({
      had_belongings: true,
      belongings_returned: 'no',
      belongings_value: 500,
    }));
    expect(result.breakdown.belongings).toBe(20);
  });
});

// ===== Military / SCRA =====

describe('military / SCRA', () => {
  it('active duty at repo → +40', () => {
    const result = qualifyLead(baseSubmission({
      military_service: true,
      active_duty_at_repo: true,
    }));
    expect(result.breakdown.military).toBe(40);
  });

  it('active duty + loan before active duty → +50', () => {
    const result = qualifyLead(baseSubmission({
      military_service: true,
      active_duty_at_repo: true,
      loan_before_active_duty: 'yes',
    }));
    expect(result.breakdown.military).toBe(50);
  });

  it('military service but not active duty → 0', () => {
    const result = qualifyLead(baseSubmission({
      military_service: true,
      active_duty_at_repo: false,
    }));
    expect(result.breakdown.military).toBe(0);
  });
});

// ===== FDCPA =====

describe('FDCPA', () => {
  it('1 violation with debt collector contact → +10', () => {
    const result = qualifyLead(baseSubmission({
      debt_collector_contact: true,
      fdcpa_violations: ['harassment'],
    }));
    expect(result.breakdown.fdcpa).toBe(10);
  });

  it('2 violations → +20', () => {
    const result = qualifyLead(baseSubmission({
      debt_collector_contact: true,
      fdcpa_violations: ['harassment', 'false_representation'],
    }));
    expect(result.breakdown.fdcpa).toBe(20);
  });

  it('3+ violations → violations×10 + 15 bonus', () => {
    const result = qualifyLead(baseSubmission({
      debt_collector_contact: true,
      fdcpa_violations: ['harassment', 'false_representation', 'unfair_practices'],
    }));
    // 3×10 + 15 = 45
    expect(result.breakdown.fdcpa).toBe(45);
  });

  it('violations without debt_collector_contact → 0', () => {
    const result = qualifyLead(baseSubmission({
      debt_collector_contact: false,
      fdcpa_violations: ['harassment', 'false_representation'],
    }));
    expect(result.breakdown.fdcpa).toBe(0);
  });
});

// ===== Notice =====

describe('notice', () => {
  it('no written notice → +10', () => {
    const result = qualifyLead(baseSubmission({
      received_written_notice: 'no',
      verbally_objected: 'yes', // need an indicator to avoid disqualification
    }));
    expect(result.breakdown.notice).toBe(10);
  });

  it('no notice of sale → +10', () => {
    const result = qualifyLead(baseSubmission({
      received_notice_of_sale: 'no',
      verbally_objected: 'yes',
    }));
    expect(result.breakdown.notice).toBe(10);
  });

  it('both missing → +20', () => {
    const result = qualifyLead(baseSubmission({
      received_written_notice: 'no',
      received_notice_of_sale: 'no',
      verbally_objected: 'yes',
    }));
    expect(result.breakdown.notice).toBe(20);
  });
});

// ===== Evidence =====

describe('evidence', () => {
  it('photos/videos → +10', () => {
    const result = qualifyLead(baseSubmission({
      has_photos_videos: true,
      verbally_objected: 'yes',
    }));
    expect(result.breakdown.evidence).toBe(10);
  });

  it('documents → +5', () => {
    const result = qualifyLead(baseSubmission({
      has_documents: true,
      verbally_objected: 'yes',
    }));
    expect(result.breakdown.evidence).toBe(5);
  });

  it('witnesses → +10', () => {
    const result = qualifyLead(baseSubmission({
      has_witnesses: true,
      verbally_objected: 'yes',
    }));
    expect(result.breakdown.evidence).toBe(10);
  });

  it('all evidence → +25', () => {
    const result = qualifyLead(baseSubmission({
      has_photos_videos: true,
      has_documents: true,
      has_witnesses: true,
      verbally_objected: 'yes',
    }));
    expect(result.breakdown.evidence).toBe(25);
  });
});

// ===== Penalty =====

describe('penalty', () => {
  it('repo > 2 years ago → −50', () => {
    const result = qualifyLead(baseSubmission({
      repo_date: '2020-01-01',
      verbally_objected: 'yes', // +15 breach
    }));
    expect(result.breakdown.penalties).toBe(-50);
  });

  it('score floors at 0', () => {
    const result = qualifyLead(baseSubmission({
      repo_date: '2020-01-01',
      verbally_objected: 'yes', // +15
    }));
    // 15 - 50 = -35, floored to 0
    expect(result.score).toBe(0);
  });
});

// ===== Combined realistic lead =====

describe('combined scoring', () => {
  it('realistic high-scoring lead has exact score and hot tier', () => {
    const result = qualifyLead(baseSubmission({
      // Breach: objected+continued(40) + physical force(35) + locked area(30) = 105
      verbally_objected: 'yes',
      continued_after_objection: 'yes',
      physical_force_or_threats: true,
      entered_locked_area: true,
      // Belongings: not returned(20) + fee(25) + high value(10) = 55
      had_belongings: true,
      belongings_returned: 'no',
      charged_fee_for_belongings: true,
      belongings_value: 1000,
      // Military: active duty(40) + loan before(10) = 50
      military_service: true,
      active_duty_at_repo: true,
      loan_before_active_duty: 'yes',
      // Notice: no written(10) + no sale(10) = 20
      received_written_notice: 'no',
      received_notice_of_sale: 'no',
      // Evidence: photos(10) + docs(5) + witnesses(10) = 25
      has_photos_videos: true,
      has_documents: true,
      has_witnesses: true,
    }));

    expect(result.breakdown.breach_of_peace).toBe(105);
    expect(result.breakdown.belongings).toBe(55);
    expect(result.breakdown.military).toBe(50);
    expect(result.breakdown.notice).toBe(20);
    expect(result.breakdown.evidence).toBe(25);
    expect(result.breakdown.penalties).toBe(0);
    expect(result.score).toBe(255);
    expect(result.tier).toBe('hot');
  });
});
