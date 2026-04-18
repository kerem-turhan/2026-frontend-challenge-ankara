/**
 * Suspicion scoring (Report 1 §7).
 *
 * The raw formula is intentionally simple so the tooltip in Step 5 can
 * explain it in plain language:
 *
 *   raw =
 *       3 * sightingsWithPodo
 *     + 2 * messagesWithPodo
 *     + 2 * tipsAboutThem
 *     + 1 * checkinsNearPodo      (same location ± 24h vs a Podo sighting)
 *     + 1 * notesMentioningPodo
 *     - 1 * unrelatedPenalty      (>10 records AND majority don't mention Podo)
 *
 * Scores are then normalised against the highest raw score in the dataset
 * (with a floor of 10) so a small corpus doesn't instantly peg everyone at
 * 100 and a large corpus doesn't crush genuinely connected suspects.
 */

import { parseISO } from 'date-fns';
import { normalizeName } from './normalize';
import type { BaseRecord, SuspicionBreakdown } from '../data/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const EMPTY_BREAKDOWN: SuspicionBreakdown = {
  sightingsWithPodo: 0,
  messagesWithPodo: 0,
  tipsAboutThem: 0,
  checkinsNearPodo: 0,
  notesWithPodo: 0,
  unrelatedPenalty: 0,
};

/** Cached location/time points for every Podo sighting. */
export interface PodoContextPoint {
  readonly locationKey: string;
  readonly time: number;
}

export function buildPodoContext(records: readonly BaseRecord[]): readonly PodoContextPoint[] {
  const points: PodoContextPoint[] = [];
  for (const record of records) {
    if (record.sourceType !== 'sighting') continue;
    if (!record.mentionsPodo) continue;
    if (!record.location) continue;
    const time = parseISO(record.occurredAt).getTime();
    if (!Number.isFinite(time)) continue;
    points.push({ locationKey: normalizeName(record.location), time });
  }
  return points;
}

function isCheckinNearPodo(record: BaseRecord, context: readonly PodoContextPoint[]): boolean {
  if (record.sourceType !== 'checkin') return false;
  if (!record.location) return false;
  const locationKey = normalizeName(record.location);
  if (locationKey.length === 0) return false;
  const time = parseISO(record.occurredAt).getTime();
  if (!Number.isFinite(time)) return false;
  for (const point of context) {
    if (point.locationKey !== locationKey) continue;
    if (Math.abs(point.time - time) <= DAY_MS) return true;
  }
  return false;
}

/**
 * Compute the full breakdown + raw score for one person, given that person's
 * records and the pre-computed Podo context points.
 */
export function computeBreakdown(
  personRecords: readonly BaseRecord[],
  context: readonly PodoContextPoint[],
): { breakdown: SuspicionBreakdown; raw: number } {
  let sightingsWithPodo = 0;
  let messagesWithPodo = 0;
  let tipsAboutThem = 0;
  let checkinsNearPodo = 0;
  let notesWithPodo = 0;
  let mentionsPodoCount = 0;

  for (const record of personRecords) {
    if (record.mentionsPodo) mentionsPodoCount += 1;

    switch (record.sourceType) {
      case 'sighting':
        if (record.mentionsPodo) sightingsWithPodo += 1;
        break;
      case 'message':
        if (record.mentionsPodo) messagesWithPodo += 1;
        break;
      case 'tip':
        tipsAboutThem += 1;
        break;
      case 'note':
        if (record.mentionsPodo) notesWithPodo += 1;
        break;
      case 'checkin':
        if (isCheckinNearPodo(record, context)) checkinsNearPodo += 1;
        break;
    }
  }

  const unrelatedPenalty =
    personRecords.length > 10 && mentionsPodoCount * 2 < personRecords.length ? 1 : 0;

  const breakdown: SuspicionBreakdown = {
    sightingsWithPodo,
    messagesWithPodo,
    tipsAboutThem,
    checkinsNearPodo,
    notesWithPodo,
    unrelatedPenalty,
  };

  const raw =
    3 * sightingsWithPodo +
    2 * messagesWithPodo +
    2 * tipsAboutThem +
    1 * checkinsNearPodo +
    1 * notesWithPodo -
    1 * unrelatedPenalty;

  return { breakdown, raw };
}

/** Linear 0–100 normalisation with a floor to keep small corpora meaningful. */
export function normaliseScore(raw: number, maxRaw: number): number {
  const denom = Math.max(maxRaw, 10);
  const scaled = Math.round((Math.max(0, raw) / denom) * 100);
  return Math.max(0, Math.min(100, scaled));
}
