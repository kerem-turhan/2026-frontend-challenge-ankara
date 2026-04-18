import { useMemo } from 'react';
import { useQueries, type UseQueryOptions } from '@tanstack/react-query';

import { FORMS } from '../config/forms';
import { ADAPTER_BY_SOURCE } from '../data/adapters';
import { buildPeopleIndex } from '../data/buildPeopleIndex';
import type {
  BaseRecord,
  InvestigationStatus,
  JotformSubmission,
  Person,
  SourceStatus,
  SourceType,
} from '../data/types';
import { getSubmissions } from '../lib/jotform';

export interface InvestigationState {
  readonly status: InvestigationStatus;
  readonly records: readonly BaseRecord[];
  readonly peopleByKey: ReadonlyMap<string, Person>;
  readonly peopleSorted: readonly Person[];
  readonly sourceStatuses: readonly SourceStatus[];
  readonly error: Error | undefined;
  readonly refetchAll: () => Promise<void>;
}

type SubmissionsQueryOptions = UseQueryOptions<
  readonly JotformSubmission[],
  Error,
  readonly JotformSubmission[],
  readonly [string, string]
>;

/**
 * Single entry point the UI consumes for every investigation-level piece of
 * state: the raw records, the aggregated people, each source's fetch status
 * and a `refetchAll` action. Wraps TanStack Query's `useQueries` so the five
 * submission fetches fan out in parallel.
 */
export function useInvestigation(): InvestigationState {
  const queries = useQueries({
    queries: FORMS.map<SubmissionsQueryOptions>((form) => ({
      queryKey: ['submissions', form.formId] as const,
      queryFn: () => getSubmissions(form.formId),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const sourceStatuses = useMemo<readonly SourceStatus[]>(
    () =>
      FORMS.map((form, i) => {
        const query = queries[i];
        const state: SourceStatus['state'] = query?.isError
          ? 'error'
          : query?.isSuccess
            ? 'success'
            : 'loading';
        const err = query?.error;
        return {
          sourceType: form.sourceType,
          state,
          ...(err instanceof Error ? { error: err } : {}),
        } satisfies SourceStatus;
      }),
    [queries],
  );

  const records = useMemo<readonly BaseRecord[]>(() => {
    const out: BaseRecord[] = [];
    FORMS.forEach((form, i) => {
      const query = queries[i];
      if (!query?.isSuccess || !query.data) return;
      const adapter = ADAPTER_BY_SOURCE[form.sourceType];
      for (const submission of query.data) {
        const record = adapter(submission);
        if (record) out.push(record);
      }
    });
    return out;
  }, [queries]);

  const { peopleByKey, peopleSorted } = useMemo(() => buildPeopleIndex(records), [records]);

  const status = useMemo<InvestigationStatus>(() => {
    const loadingCount = sourceStatuses.filter((s) => s.state === 'loading').length;
    const errorCount = sourceStatuses.filter((s) => s.state === 'error').length;
    const successCount = sourceStatuses.filter((s) => s.state === 'success').length;

    if (errorCount === sourceStatuses.length) return 'error';
    if (loadingCount > 0 && successCount === 0 && errorCount === 0) return 'loading';
    if (successCount === sourceStatuses.length) return 'ready';
    return 'partial';
  }, [sourceStatuses]);

  const error = useMemo<Error | undefined>(() => {
    for (const s of sourceStatuses) {
      if (s.state === 'error' && s.error) return s.error;
    }
    return undefined;
  }, [sourceStatuses]);

  const refetchAll = useMemo(() => {
    return async () => {
      await Promise.all(queries.map((q) => q.refetch()));
    };
  }, [queries]);

  return {
    status,
    records,
    peopleByKey,
    peopleSorted,
    sourceStatuses,
    error,
    refetchAll,
  };
}

/** Convenience: `sourceStatusesByType[source]` → `SourceStatus['state']`. */
export function indexStatusesByType(
  statuses: readonly SourceStatus[],
): Readonly<Record<SourceType, SourceStatus['state']>> {
  const result: Record<SourceType, SourceStatus['state']> = {
    checkin: 'loading',
    message: 'loading',
    sighting: 'loading',
    note: 'loading',
    tip: 'loading',
  };
  for (const s of statuses) {
    result[s.sourceType] = s.state;
  }
  return result;
}
