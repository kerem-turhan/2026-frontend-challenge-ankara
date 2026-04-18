/**
 * Small, allocation-light text helpers shared across adapters, scoring, and UI.
 * All functions are pure and side-effect free.
 */

/** Coerce unknown values into a trimmed string, or `undefined` when empty. */
export function safeString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

/**
 * Case-insensitive "mentions Podo" detector. Checks every part in one pass.
 * Used both by adapters (record-level flag) and by filters (`only Podo`).
 */
export function mentionsPodo(...parts: readonly (string | undefined | null)[]): boolean {
  for (const part of parts) {
    if (part && part.toLowerCase().includes('podo')) return true;
  }
  return false;
}

/**
 * Build two-letter initials for avatars. Falls back to a single dot
 * when the string is empty after trimming.
 */
export function initials(value: string | undefined): string {
  if (!value) return '·';
  const tokens = value.trim().split(/\s+/u).filter(Boolean);
  if (tokens.length === 0) return '·';
  const first = tokens[0]?.[0] ?? '';
  const last = tokens.length > 1 ? (tokens[tokens.length - 1]?.[0] ?? '') : '';
  const initialsRaw = `${first}${last}`;
  return initialsRaw.length > 0 ? initialsRaw.toLocaleUpperCase('tr') : '·';
}
