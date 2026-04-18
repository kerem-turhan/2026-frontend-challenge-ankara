import { useCallback, useEffect, useMemo, useState } from 'react';

import { Dossier } from './components/Dossier';
import { PartialErrorBanner } from './components/PartialErrorBanner';
import { PeoplePane } from './components/PeoplePane';
import { TopBar } from './components/TopBar';
import { Button } from './components/ui/Button';
import { ErrorState } from './components/ui/ErrorState';
import { buildPeopleIndex } from './data/buildPeopleIndex';
import { applyFilters, useFilters } from './hooks/useFilters';
import { useInvestigation } from './hooks/useInvestigation';

const HASH_PERSON_KEY = 'person';

function readHashPersonKey(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;
  try {
    const params = new URLSearchParams(hash);
    const raw = params.get(HASH_PERSON_KEY);
    if (!raw) return null;
    const value = raw.trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeHashPersonKey(key: string | null): void {
  if (typeof window === 'undefined') return;
  const next = key ? `#${HASH_PERSON_KEY}=${encodeURIComponent(key)}` : ' ';
  window.history.replaceState(null, '', next);
}

export default function App() {
  const { status, records, peopleByKey, peopleSorted, sourceStatuses, error, refetchAll } =
    useInvestigation();
  const filters = useFilters();
  const [selectedPersonKey, setSelectedPersonKey] = useState<string | null>(() =>
    readHashPersonKey(),
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    writeHashPersonKey(selectedPersonKey);
  }, [selectedPersonKey]);

  const filteredRecords = useMemo(
    () =>
      applyFilters(records, {
        query: filters.deferredQuery,
        sourceTypes: filters.sourceTypes,
        onlyPodo: filters.onlyPodo,
      }),
    [records, filters.deferredQuery, filters.sourceTypes, filters.onlyPodo],
  );

  const filteredIndex = useMemo(() => buildPeopleIndex(filteredRecords), [filteredRecords]);

  const selectedPerson = selectedPersonKey
    ? filteredIndex.peopleByKey.get(selectedPersonKey)
    : undefined;

  const selectedFallback = selectedPersonKey ? peopleByKey.get(selectedPersonKey) : undefined;

  const handleSelectPerson = useCallback((key: string) => {
    setSelectedPersonKey(key);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

  const isHardError = status === 'error';

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar
        query={filters.query}
        onQueryChange={filters.setQuery}
        onlyPodo={filters.onlyPodo}
        onOnlyPodoChange={filters.setOnlyPodo}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        refreshDisabled={status === 'loading'}
      />
      {status === 'partial' ? (
        <PartialErrorBanner
          sourceStatuses={sourceStatuses}
          onRetry={handleRefresh}
          retrying={refreshing}
        />
      ) : null}
      {isHardError ? (
        <main className="flex flex-1 items-center justify-center overflow-hidden">
          <ErrorState
            title="We couldn't load the case files"
            description="All five sources failed to respond. Check your connection or try refreshing."
            action={
              <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
                Retry
              </Button>
            }
            {...(error?.message ? { details: error.message } : {})}
          />
        </main>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <PeoplePane
            people={filteredIndex.peopleSorted}
            totalPeople={peopleSorted.length}
            selectedKey={selectedPersonKey}
            onSelect={handleSelectPerson}
            status={status}
            sourceTypes={filters.sourceTypes}
            onToggleSource={filters.toggleSource}
            onSelectAllSources={filters.setAllSources}
            hasActiveFilters={filters.hasActiveFilters}
            onClearFilters={filters.clearFilters}
          />
          <Dossier
            person={selectedPerson}
            peopleByKey={filteredIndex.peopleByKey}
            onSelectPerson={handleSelectPerson}
            loading={status === 'loading'}
            hasSelection={selectedPersonKey !== null}
            {...(selectedFallback?.displayName
              ? { selectedFallbackName: selectedFallback.displayName }
              : {})}
            hasActiveFilters={filters.hasActiveFilters}
            onClearFilters={filters.clearFilters}
          />
        </div>
      )}
    </div>
  );
}
