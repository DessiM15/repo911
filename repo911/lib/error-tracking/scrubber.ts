/**
 * Legal-grade PII scrubber for Repo911 error tracking.
 *
 * Strips emails, phones, VINs, Stripe tokens, bar numbers,
 * ZIP codes, IP addresses, and sensitive field values before
 * any error data hits the database.
 */

// ---------- Pattern definitions ----------

const PII_PATTERNS: { pattern: RegExp; label: string }[] = [
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, label: '[EMAIL]' },
  // Stripe IDs — match before phone/SSN to avoid partial matches on digits within IDs
  { pattern: /\b(cus|pi|ch|sub|pm|evt|cs|si|seti|in)_[A-Za-z0-9]{10,}\b/g, label: '[STRIPE_ID]' },
  // Credit card (16 digits, optionally grouped)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: '[CARD]' },
  // SSN
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: '[SSN]' },
  // VIN (17 alphanumeric, excluding I/O/Q)
  { pattern: /\b[A-HJ-NPR-Z0-9]{17}\b/g, label: '[VIN]' },
  // US phone numbers (various formats including (800) 555-1234)
  { pattern: /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, label: '[PHONE]' },
  // IP addresses (v4)
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: '[IP]' },
  // ZIP codes (5 or 5+4)
  { pattern: /\b\d{5}(-\d{4})?\b/g, label: '[ZIP]' },
];

// Fields whose values should be completely redacted
const REDACTED_FIELDS = new Set([
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'x-api-key',
  'electronic_signature',
  'narrative',
  'witness_info',
  'belongings_list',
  'bar_number',
  'ssn',
  'credit_card',
  'creditcard',
]);

// Fields that are always safe to keep (prevent over-scrubbing)
const SAFE_FIELDS = new Set([
  'id',
  'error_id',
  'fingerprint',
  'error_type',
  'level',
  'status',
  'type',
  'name',
  'timestamp',
  'created_at',
  'updated_at',
  'environment',
  'platform',
  'occurrence_count',
  'tags',
  'http_method',
  'device_type',
  'browser_name',
  'browser_version',
  'os_name',
  'os_version',
]);

// ---------- Scrubbing functions ----------

/** Scrub PII patterns from a string. */
function scrubString(value: string): string {
  let result = value;
  for (const { pattern, label } of PII_PATTERNS) {
    // Reset lastIndex for global regexps
    pattern.lastIndex = 0;
    result = result.replace(pattern, label);
  }
  return result;
}

/** Recursively scrub an object, array, or primitive. */
export function scrubPII(input: unknown, depth = 0): unknown {
  // Prevent infinite recursion on deeply nested objects
  if (depth > 10) return '[TRUNCATED]';

  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return scrubString(input);
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => scrubPII(item, depth + 1));
  }

  if (typeof input === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const keyLower = key.toLowerCase();

      // Completely redact sensitive field values
      if (REDACTED_FIELDS.has(keyLower)) {
        scrubbed[key] = '[REDACTED]';
        continue;
      }

      // Safe fields pass through without string scrubbing
      if (SAFE_FIELDS.has(keyLower)) {
        scrubbed[key] = value;
        continue;
      }

      // Everything else gets recursively scrubbed
      scrubbed[key] = scrubPII(value, depth + 1);
    }
    return scrubbed;
  }

  return input;
}

/** Scrub PII from request headers, removing auth-related headers entirely. */
export function scrubHeaders(headers?: Record<string, string>): Record<string, string> | null {
  if (!headers) return null;

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const keyLower = key.toLowerCase();
    if (REDACTED_FIELDS.has(keyLower)) continue; // Drop entirely
    if (keyLower === 'set-cookie') continue;
    result[key] = scrubString(value);
  }
  return result;
}
