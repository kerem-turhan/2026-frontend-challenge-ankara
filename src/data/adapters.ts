/**
 * Adapters translate Jotform's dynamic `answers` map into the uniform
 * `BaseRecord` shape that the rest of the app consumes.
 *
 * Design notes:
 *   - No `any`. Raw fields flow through `extractAnswerString` which guards
 *     against strings, numbers, `{ first, last }` name objects and Jotform
 *     datetime objects (`{ prettyFormat, datetime }`).
 *   - Field resolution is keyword-based (`name`/`text` includes) so a form
 *     renaming a field doesn't immediately break the adapter.
 *   - Each adapter returns `undefined` only when even `created_at` fails to
 *     parse. Missing optional fields are simply omitted from the record so
 *     the UI can render "Unknown" placeholders consistently.
 */

import { resolveEventDate } from '../utils/date';
import { mentionsPodo as detectsPodo, safeString } from '../utils/text';
import type { BaseRecord, JotformAnswer, JotformSubmission, SourceType } from './types';

type Answer = JotformAnswer & { readonly id?: string };
type AnswerEntry = readonly [string, Answer];

const PRIMARY_KEYWORDS = [
  'sender',
  'author',
  'writer',
  'from',
  'seer',
  'reporter',
  'person',
  'checked',
  'suspect',
  'who',
] as const;

const OTHER_KEYWORDS = [
  'recipient',
  'receiver',
  'mentioned',
  'seen',
  'saw',
  'with',
  'about',
  'target',
  'subject',
  'other',
  'to',
] as const;

const LOCATION_KEYWORDS = ['location', 'where', 'place', 'city', 'area', 'venue'] as const;

const CONTENT_KEYWORDS = [
  'message',
  'note',
  'text',
  'tip',
  'detail',
  'content',
  'comment',
  'body',
  'description',
] as const;

const STRONG_TIME_KEYWORDS = ['timestamp', 'time', 'when', 'occurred', 'event'] as const;

const WEAK_TIME_KEYWORDS = ['date'] as const;

/**
 * Turn any raw Jotform answer value into a clean string.
 * Handles:
 *   - Plain strings.
 *   - Finite numbers.
 *   - `{ first, middle, last }` name objects.
 *   - `{ prettyFormat, datetime }` datetime objects.
 *   - Arrays (joined with ", ").
 */
function extractAnswerString(value: unknown): string | undefined {
  const plain = safeString(value);
  if (plain) return plain;

  if (Array.isArray(value)) {
    const joined = value
      .map((v) => extractAnswerString(v))
      .filter((v): v is string => Boolean(v))
      .join(', ');
    return joined.length > 0 ? joined : undefined;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const pretty = safeString(obj['prettyFormat']);
    if (pretty) return pretty;
    const datetime = safeString(obj['datetime']);
    if (datetime) return datetime;

    const parts = [obj['first'], obj['middle'], obj['last']]
      .map((p) => safeString(p))
      .filter((p): p is string => Boolean(p));
    if (parts.length > 0) return parts.join(' ');
  }

  return undefined;
}

/** Lowercase haystack built from an answer's `name` and `text` fields. */
function answerHaystack(answer: Answer): string {
  return `${answer.name ?? ''} ${answer.text ?? ''}`.toLowerCase();
}

/** Does an answer's name/text match any of the keywords? */
function matchesKeyword(answer: Answer, keywords: readonly string[]): boolean {
  const haystack = answerHaystack(answer);
  for (const kw of keywords) {
    if (haystack.includes(kw)) return true;
  }
  return false;
}

/** Find the first answer matching any keyword and yield its string value. */
function findAnswerValue(
  entries: readonly AnswerEntry[],
  keywords: readonly string[],
  skipKeys?: ReadonlySet<string>,
): { key: string; value: string } | undefined {
  for (const [key, answer] of entries) {
    if (skipKeys?.has(key)) continue;
    if (!matchesKeyword(answer, keywords)) continue;
    const value = extractAnswerString(answer.answer);
    if (value) return { key, value };
  }
  return undefined;
}

/** Find the event date answer, preferring `control_datetime` + strong keywords. */
function findEventDateString(entries: readonly AnswerEntry[]): string | undefined {
  for (const [, answer] of entries) {
    if (answer.type === 'control_datetime') {
      const value = extractAnswerString(answer.answer);
      if (value) return value;
    }
  }
  for (const [, answer] of entries) {
    if (matchesKeyword(answer, STRONG_TIME_KEYWORDS)) {
      const value = extractAnswerString(answer.answer);
      if (value) return value;
    }
  }
  for (const [, answer] of entries) {
    if (matchesKeyword(answer, WEAK_TIME_KEYWORDS)) {
      const value = extractAnswerString(answer.answer);
      if (value) return value;
    }
  }
  return undefined;
}

/** Stable iteration order based on the `order` attribute (ascending). */
function toOrderedEntries(submission: JotformSubmission): readonly AnswerEntry[] {
  const raw = Object.entries(submission.answers) as AnswerEntry[];
  return raw.slice().sort(([, a], [, b]) => {
    const ao = Number.parseInt(a.order ?? '', 10);
    const bo = Number.parseInt(b.order ?? '', 10);
    const aSafe = Number.isFinite(ao) ? ao : Number.MAX_SAFE_INTEGER;
    const bSafe = Number.isFinite(bo) ? bo : Number.MAX_SAFE_INTEGER;
    return aSafe - bSafe;
  });
}

/**
 * Generic adapter used by every source. The per-source `toX` wrappers below
 * only differ in which keyword list they apply to the "primary" slot.
 */
function toBaseRecord(
  submission: JotformSubmission,
  sourceType: SourceType,
  overrides: {
    readonly primaryKeywords?: readonly string[];
    readonly otherKeywords?: readonly string[];
  } = {},
): BaseRecord | undefined {
  const entries = toOrderedEntries(submission);

  const primary = findAnswerValue(entries, overrides.primaryKeywords ?? PRIMARY_KEYWORDS);
  const usedKeys = new Set<string>();
  if (primary) usedKeys.add(primary.key);

  const other = findAnswerValue(entries, overrides.otherKeywords ?? OTHER_KEYWORDS, usedKeys);
  if (other) usedKeys.add(other.key);

  const location = findAnswerValue(entries, LOCATION_KEYWORDS, usedKeys);
  if (location) usedKeys.add(location.key);

  const content = findAnswerValue(entries, CONTENT_KEYWORDS, usedKeys);
  if (content) usedKeys.add(content.key);

  const eventDate = findEventDateString(entries);
  const occurred = resolveEventDate(eventDate, submission.created_at);
  if (!occurred) return undefined;

  const personName = primary?.value;
  const otherPersonName = other?.value;
  const locationText = location?.value;
  const contentText = content?.value;

  const record: BaseRecord = {
    id: submission.id,
    sourceType,
    occurredAt: occurred.toISOString(),
    mentionsPodo: detectsPodo(personName, otherPersonName, locationText, contentText),
    raw: submission,
    ...(personName !== undefined && { personName }),
    ...(otherPersonName !== undefined && { otherPersonName }),
    ...(locationText !== undefined && { location: locationText }),
    ...(contentText !== undefined && { text: contentText }),
  };

  return record;
}

export function toCheckin(submission: JotformSubmission): BaseRecord | undefined {
  return toBaseRecord(submission, 'checkin');
}

export function toMessage(submission: JotformSubmission): BaseRecord | undefined {
  return toBaseRecord(submission, 'message', {
    primaryKeywords: ['sender', 'from', 'author', 'writer', 'person'],
    otherKeywords: ['recipient', 'receiver', 'to', 'target', 'other', 'about'],
  });
}

export function toSighting(submission: JotformSubmission): BaseRecord | undefined {
  return toBaseRecord(submission, 'sighting', {
    primaryKeywords: ['person', 'seer', 'reporter', 'who', 'suspect', 'author'],
    otherKeywords: ['seen', 'saw', 'with', 'mentioned', 'about', 'target', 'other'],
  });
}

export function toNote(submission: JotformSubmission): BaseRecord | undefined {
  return toBaseRecord(submission, 'note', {
    primaryKeywords: ['author', 'writer', 'reporter', 'from', 'person', 'who'],
    otherKeywords: ['mentioned', 'about', 'subject', 'target', 'with', 'other', 'to'],
  });
}

export function toTip(submission: JotformSubmission): BaseRecord | undefined {
  return toBaseRecord(submission, 'tip', {
    primaryKeywords: ['suspect', 'subject', 'target', 'about', 'person', 'who'],
    otherKeywords: ['with', 'mentioned', 'other', 'to'],
  });
}

export const ADAPTER_BY_SOURCE: Readonly<
  Record<SourceType, (submission: JotformSubmission) => BaseRecord | undefined>
> = {
  checkin: toCheckin,
  message: toMessage,
  sighting: toSighting,
  note: toNote,
  tip: toTip,
};
