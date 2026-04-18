/**
 * People in the Jotform data are written with different cases and diacritics
 * ("Aslı", "aslı", "Asli"). We normalize all spellings to a single key so the
 * aggregation step can treat them as the same person.
 *
 * Rules (Report 1 §5, §7):
 *   1. Lowercase using the Turkish locale so "İ" → "i" and "I" → "ı".
 *   2. NFD-decompose then strip combining marks (diacritics).
 *   3. Trim and collapse internal whitespace to single spaces.
 */
export function normalizeName(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.length === 0) return '';
  const lowered = trimmed.toLocaleLowerCase('tr');
  const stripped = lowered.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return stripped.replace(/\s+/gu, ' ').trim();
}

/**
 * Heuristic that flags a raw name as "looks like a real display candidate" —
 * i.e. it has at least one character and is not fully lowercase. Used by the
 * people-index to pick a friendly `displayName` per key.
 */
export function isDisplayCandidate(raw: string): boolean {
  if (raw.trim().length === 0) return false;
  return raw !== raw.toLocaleLowerCase('tr');
}
