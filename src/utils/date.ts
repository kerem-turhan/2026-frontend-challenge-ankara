import { format, formatDistanceToNowStrict, isValid, parse, parseISO } from 'date-fns';

/**
 * Jotform forms in this challenge ship two non-ISO shapes:
 *   - Event timestamps: "18-04-2026 19:05" (DD-MM-YYYY HH:mm).
 *   - Submission `created_at`: "2026-04-17 14:00:58" (YYYY-MM-DD HH:mm:ss).
 * Plus the occasional "Apr 6, 2026" and the rare ISO fallback. We try parsers
 * in that order and return the first that produces a valid Date.
 */
const KNOWN_FORMATS = [
  'dd-MM-yyyy HH:mm',
  'dd-MM-yyyy HH:mm:ss',
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd HH:mm',
  'dd/MM/yyyy HH:mm',
  'MMM d, yyyy',
  'MMMM d, yyyy',
] as const;

/** Parse a loose Jotform-style date string into a Date, or `undefined`. */
export function parseLooseDate(raw: string | undefined | null): Date | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (value.length === 0) return undefined;

  for (const pattern of KNOWN_FORMATS) {
    const parsed = parse(value, pattern, new Date());
    if (isValid(parsed)) return parsed;
  }

  const iso = parseISO(value);
  if (isValid(iso)) return iso;

  const native = new Date(value);
  return isValid(native) ? native : undefined;
}

/**
 * Try the candidate event string first (usually the form's `timestamp`
 * answer). Fall back to the submission's `created_at` when that fails so
 * records never land on the timeline with an invalid date.
 */
export function resolveEventDate(
  candidate: string | undefined,
  createdAt: string | undefined,
): Date | undefined {
  return parseLooseDate(candidate) ?? parseLooseDate(createdAt);
}

/** Relative "2 hours ago" string. Returns `undefined` for missing/invalid. */
export function formatRelative(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = parseISO(iso);
  if (!isValid(date)) return undefined;
  return `${formatDistanceToNowStrict(date)} ago`;
}

/** Absolute "Apr 18, 14:02" string. Returns `undefined` for missing/invalid. */
export function formatAbsolute(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = parseISO(iso);
  if (!isValid(date)) return undefined;
  return format(date, 'MMM d, HH:mm');
}

/** Long form for tooltips: "Apr 18, 2026 · 14:02". */
export function formatAbsoluteLong(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = parseISO(iso);
  if (!isValid(date)) return undefined;
  return format(date, "MMM d, yyyy '·' HH:mm");
}
