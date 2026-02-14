import { describe, it, expect } from 'vitest';
import {
  formatPhone,
  formatCurrency,
  formatDate,
  getQualificationColor,
  getQualificationLabel,
  getEstimatedValueRange,
} from '../utils';

describe('formatPhone', () => {
  it('formats a 10-digit number as (XXX) XXX-XXXX', () => {
    expect(formatPhone('5551234567')).toBe('(555) 123-4567');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhone('555-123-4567')).toBe('(555) 123-4567');
  });

  it('returns the original string for non-10-digit input', () => {
    expect(formatPhone('12345')).toBe('12345');
    expect(formatPhone('155512345678')).toBe('155512345678');
  });
});

describe('formatCurrency', () => {
  it('formats cents to USD', () => {
    expect(formatCurrency(100000)).toBe('$1,000.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats values under a dollar', () => {
    expect(formatCurrency(50)).toBe('$0.50');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(result).toBe('January 15, 2024');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2024-07-04T12:00:00Z'));
    expect(result).toContain('July');
    expect(result).toContain('2024');
  });
});

describe('getQualificationColor', () => {
  it('returns red classes for hot', () => {
    expect(getQualificationColor('hot')).toContain('text-red-600');
  });

  it('returns yellow classes for warm', () => {
    expect(getQualificationColor('warm')).toContain('text-yellow-600');
  });

  it('returns blue classes for cold', () => {
    expect(getQualificationColor('cold')).toContain('text-blue-600');
  });

  it('returns gray classes for disqualified', () => {
    expect(getQualificationColor('disqualified')).toContain('text-gray-500');
  });

  it('returns gray classes for null (default)', () => {
    expect(getQualificationColor(null)).toContain('text-gray-500');
  });
});

describe('getQualificationLabel', () => {
  it('returns "Hot Lead" for hot', () => {
    expect(getQualificationLabel('hot')).toBe('Hot Lead');
  });

  it('returns "Warm Lead" for warm', () => {
    expect(getQualificationLabel('warm')).toBe('Warm Lead');
  });

  it('returns "Cold Lead" for cold', () => {
    expect(getQualificationLabel('cold')).toBe('Cold Lead');
  });

  it('returns "Not Qualified" for disqualified', () => {
    expect(getQualificationLabel('disqualified')).toBe('Not Qualified');
  });

  it('returns "Pending" for null', () => {
    expect(getQualificationLabel(null)).toBe('Pending');
  });
});

describe('getEstimatedValueRange', () => {
  it('returns highest range for score >= 80', () => {
    expect(getEstimatedValueRange(80)).toBe('$25,000 - $100,000+');
    expect(getEstimatedValueRange(100)).toBe('$25,000 - $100,000+');
  });

  it('returns mid-high range for score >= 60', () => {
    expect(getEstimatedValueRange(60)).toBe('$10,000 - $50,000');
    expect(getEstimatedValueRange(79)).toBe('$10,000 - $50,000');
  });

  it('returns mid range for score >= 30', () => {
    expect(getEstimatedValueRange(30)).toBe('$5,000 - $25,000');
    expect(getEstimatedValueRange(59)).toBe('$5,000 - $25,000');
  });

  it('returns lowest range for score < 30', () => {
    expect(getEstimatedValueRange(0)).toBe('$1,000 - $10,000');
    expect(getEstimatedValueRange(29)).toBe('$1,000 - $10,000');
  });
});
