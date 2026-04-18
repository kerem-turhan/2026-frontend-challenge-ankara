/**
 * Client-side filter state + pure `applyFilters` pipeline for the investigation
 * dashboard. All three filters (search, source-type chips, "only Podo" toggle)
 * live here so the App can derive a single `filteredRecords` list and feed both
 * the people pane and the dossier from one source of truth (Report 1 §9).
 *
 * Debouncing is handled via `useDeferredValue` so we don't introduce a custom
 * debounce hook for such a tiny scope; React already schedules updates behind
 * more urgent work, which keeps keystrokes smooth without a manual timer.
 */

import { useCallback, useDeferredValue, useMemo, useState } from 'react';

import type { BaseRecord, SourceType } from '../data/types';

export const ALL_SOURCE_TYPES: readonly SourceType[] = [
  'checkin',
  'message',
  'sighting',
  'note',
  'tip',
];

export interface AppliedFilters {
  readonly query: string;
  readonly sourceTypes: ReadonlySet<SourceType>;
  readonly onlyPodo: boolean;
}

export interface UseFiltersResult {
  readonly query: string;
  readonly deferredQuery: string;
  readonly sourceTypes: ReadonlySet<SourceType>;
  readonly onlyPodo: boolean;
  readonly hasActiveFilters: boolean;
  readonly setQuery: (next: string) => void;
  readonly toggleSource: (source: SourceType) => void;
  readonly setAllSources: () => void;
  readonly setOnlyPodo: (next: boolean) => void;
  readonly clearFilters: () => void;
}

function buildAllSourcesSet(): Set<SourceType> {
  return new Set<SourceType>(ALL_SOURCE_TYPES);
}

/**
 * Same-locale search normalization used by `normalizeName`, but kept inline
 * because we also want to match location/text values that are not strictly
 * names. Turkish lowercase + NFD diacritic strip means "Kızılay" matches
 * "kizilay" and "Aslı" matches "asli".
 */
function normalizeSearchable(value: string | undefined): string {
  if (!value) return '';
  const lowered = value.toLocaleLowerCase('tr');
  return lowered.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function useFilters(): UseFiltersResult {
  const [query, setQueryState] = useState<string>('');
  const [sourceTypes, setSourceTypes] = useState<ReadonlySet<SourceType>>(() =>
    buildAllSourcesSet(),
  );
  const [onlyPodo, setOnlyPodoState] = useState<boolean>(false);

  const deferredQuery = useDeferredValue(query);

  const setQuery = useCallback((next: string) => {
    setQueryState(next);
  }, []);

  const toggleSource = useCallback((source: SourceType) => {
    setSourceTypes((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  }, []);

  const setAllSources = useCallback(() => {
    setSourceTypes(buildAllSourcesSet());
  }, []);

  const setOnlyPodo = useCallback((next: boolean) => {
    setOnlyPodoState(next);
  }, []);

  const clearFilters = useCallback(() => {
    setQueryState('');
    setSourceTypes(buildAllSourcesSet());
    setOnlyPodoState(false);
  }, []);

  const hasActiveFilters = useMemo(() => {
    if (query.trim().length > 0) return true;
    if (onlyPodo) return true;
    if (sourceTypes.size !== ALL_SOURCE_TYPES.length) return true;
    return false;
  }, [query, sourceTypes, onlyPodo]);

  return {
    query,
    deferredQuery,
    sourceTypes,
    onlyPodo,
    hasActiveFilters,
    setQuery,
    toggleSource,
    setAllSources,
    setOnlyPodo,
    clearFilters,
  };
}

/**
 * Pure filter reducer. Safe to memoise on `(records, filters)` identity since
 * it only reads from the inputs. Search normalizes each record's textual
 * fields lazily so non-matching records short-circuit after the first hit.
 */
export function applyFilters(
  records: readonly BaseRecord[],
  filters: AppliedFilters,
): readonly BaseRecord[] {
  const normalizedQuery = normalizeSearchable(filters.query.trim());
  const hasQuery = normalizedQuery.length > 0;
  const allSourcesActive = filters.sourceTypes.size === ALL_SOURCE_TYPES.length;

  if (!hasQuery && !filters.onlyPodo && allSourcesActive) {
    return records;
  }

  const out: BaseRecord[] = [];
  for (const record of records) {
    if (!filters.sourceTypes.has(record.sourceType)) continue;
    if (filters.onlyPodo && !record.mentionsPodo) continue;
    if (hasQuery) {
      const haystack =
        normalizeSearchable(record.personName) +
        ' ' +
        normalizeSearchable(record.otherPersonName) +
        ' ' +
        normalizeSearchable(record.location) +
        ' ' +
        normalizeSearchable(record.text);
      if (!haystack.includes(normalizedQuery)) continue;
    }
    out.push(record);
  }
  return out;
}
