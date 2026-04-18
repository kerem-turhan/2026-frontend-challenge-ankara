/**
 * Aggregate records into people. One pass builds raw aggregations per key,
 * a second pass computes suspicion scores (needs the full dataset so the
 * denominator is stable), and a final pass produces the sorted array.
 */

import {
  buildPodoContext,
  computeBreakdown,
  EMPTY_BREAKDOWN,
  normaliseScore,
} from '../lib/scoring';
import { isDisplayCandidate, normalizeName } from '../lib/normalize';
import type { BaseRecord, Person, SourceType } from './types';

const EMPTY_SOURCE_COUNTS: Readonly<Record<SourceType, number>> = {
  checkin: 0,
  message: 0,
  sighting: 0,
  note: 0,
  tip: 0,
};

interface Aggregation {
  key: string;
  records: BaseRecord[];
  sourceCounts: Record<SourceType, number>;
  otherPeople: Set<string>;
  latestSeenAt: string | undefined;
  lastLocation: string | undefined;
  latestSeenTime: number;
  mentionsPodoCount: number;
  rawNameCounts: Map<string, number>;
}

function createAggregation(key: string): Aggregation {
  return {
    key,
    records: [],
    sourceCounts: { ...EMPTY_SOURCE_COUNTS },
    otherPeople: new Set<string>(),
    latestSeenAt: undefined,
    lastLocation: undefined,
    latestSeenTime: -Infinity,
    mentionsPodoCount: 0,
    rawNameCounts: new Map<string, number>(),
  };
}

function bumpName(map: Map<string, number>, raw: string | undefined) {
  if (!raw) return;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return;
  map.set(trimmed, (map.get(trimmed) ?? 0) + 1);
}

function attach(
  agg: Aggregation,
  record: BaseRecord,
  rawName: string | undefined,
  otherKey: string | undefined,
) {
  agg.records.push(record);
  agg.sourceCounts[record.sourceType] += 1;
  if (record.mentionsPodo) agg.mentionsPodoCount += 1;
  bumpName(agg.rawNameCounts, rawName);

  if (otherKey && otherKey.length > 0 && otherKey !== agg.key) {
    agg.otherPeople.add(otherKey);
  }

  const time = Date.parse(record.occurredAt);
  if (Number.isFinite(time) && time > agg.latestSeenTime) {
    agg.latestSeenTime = time;
    agg.latestSeenAt = record.occurredAt;
    agg.lastLocation = record.location;
  }
}

function pickDisplayName(rawCounts: Map<string, number>, fallbackKey: string): string {
  if (rawCounts.size === 0) {
    return fallbackKey.length > 0 ? fallbackKey : 'Unknown';
  }
  let bestCandidate: string | undefined;
  let bestCandidateCount = -1;
  let bestAny: string | undefined;
  let bestAnyCount = -1;

  for (const [name, count] of rawCounts) {
    if (count > bestAnyCount) {
      bestAny = name;
      bestAnyCount = count;
    }
    if (isDisplayCandidate(name) && count > bestCandidateCount) {
      bestCandidate = name;
      bestCandidateCount = count;
    }
  }
  return bestCandidate ?? bestAny ?? fallbackKey;
}

export interface PeopleIndex {
  readonly peopleByKey: ReadonlyMap<string, Person>;
  readonly peopleSorted: readonly Person[];
}

/**
 * Build the full people index from a list of normalized records.
 * Pure function: safe to memoise on `records` identity.
 */
export function buildPeopleIndex(records: readonly BaseRecord[]): PeopleIndex {
  const aggregations = new Map<string, Aggregation>();
  const context = buildPodoContext(records);

  function getOrCreate(key: string): Aggregation {
    let agg = aggregations.get(key);
    if (!agg) {
      agg = createAggregation(key);
      aggregations.set(key, agg);
    }
    return agg;
  }

  for (const record of records) {
    const primaryKey = normalizeName(record.personName);
    const otherKey = normalizeName(record.otherPersonName);

    if (primaryKey.length > 0) {
      const agg = getOrCreate(primaryKey);
      attach(agg, record, record.personName, otherKey.length > 0 ? otherKey : undefined);
    }

    if (otherKey.length > 0 && otherKey !== primaryKey) {
      const agg = getOrCreate(otherKey);
      attach(agg, record, record.otherPersonName, primaryKey.length > 0 ? primaryKey : undefined);
    }
  }

  const rawScores = new Map<string, { raw: number; breakdown: typeof EMPTY_BREAKDOWN }>();
  let maxRaw = 0;
  for (const [key, agg] of aggregations) {
    const { raw, breakdown } = computeBreakdown(agg.records, context);
    rawScores.set(key, { raw, breakdown });
    if (raw > maxRaw) maxRaw = raw;
  }

  const peopleByKey = new Map<string, Person>();
  for (const [key, agg] of aggregations) {
    const score = rawScores.get(key) ?? { raw: 0, breakdown: EMPTY_BREAKDOWN };
    const person: Person = {
      key,
      displayName: pickDisplayName(agg.rawNameCounts, key),
      records: agg.records,
      ...(agg.latestSeenAt !== undefined && { latestSeenAt: agg.latestSeenAt }),
      ...(agg.lastLocation !== undefined && { lastLocation: agg.lastLocation }),
      otherPeople: Array.from(agg.otherPeople).sort(),
      sourceCounts: agg.sourceCounts,
      mentionsPodoCount: agg.mentionsPodoCount,
      suspicionScore: normaliseScore(score.raw, maxRaw),
      suspicionBreakdown: score.breakdown,
    };
    peopleByKey.set(key, person);
  }

  const peopleSorted = Array.from(peopleByKey.values()).sort((a, b) => {
    if (b.suspicionScore !== a.suspicionScore) return b.suspicionScore - a.suspicionScore;
    const aTime = a.latestSeenAt ? Date.parse(a.latestSeenAt) : -Infinity;
    const bTime = b.latestSeenAt ? Date.parse(b.latestSeenAt) : -Infinity;
    if (bTime !== aTime) return bTime - aTime;
    return a.displayName.localeCompare(b.displayName, 'tr');
  });

  return { peopleByKey, peopleSorted };
}
