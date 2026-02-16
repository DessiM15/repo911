/**
 * Sanitize a search parameter for safe use in PostgREST .or() filter strings.
 *
 * PostgREST filters use commas, periods, and parentheses as operators.
 * Unsanitized user input interpolated into .or() calls allows filter injection
 * (e.g. injecting extra filter clauses via commas or parentheses).
 *
 * This uses an allowlist approach — only alphanumeric characters, spaces,
 * hyphens, apostrophes, and @ (for email searches) are permitted.
 */

const SEARCH_ALLOWLIST = /[^a-zA-Z0-9@' \-]/g;
const MAX_SEARCH_LENGTH = 100;

export function sanitizeSearchParam(raw: string): string {
  return raw.replace(SEARCH_ALLOWLIST, '').slice(0, MAX_SEARCH_LENGTH);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}
