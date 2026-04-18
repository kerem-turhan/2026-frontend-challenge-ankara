import { FileSearch, FilterX } from 'lucide-react';

import type { Person } from '../data/types';
import { initials } from '../utils/text';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { SummaryCards } from './SummaryCards';
import { Timeline } from './Timeline';

export interface DossierProps {
  person: Person | undefined;
  peopleByKey: ReadonlyMap<string, Person>;
  onSelectPerson: (key: string) => void;
  loading?: boolean;
  hasSelection?: boolean;
  selectedFallbackName?: string | undefined;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

const TIMELINE_SKELETON_ROWS = 4;
const SUMMARY_SKELETON_CARDS = 4;

function DossierSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto" aria-busy="true">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <header className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </header>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: SUMMARY_SKELETON_CARDS }, (_, i) => (
            <Card key={i}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-3 h-2 w-full rounded-full" />
            </Card>
          ))}
        </section>
        <section className="flex flex-col gap-3">
          <header className="flex items-baseline justify-between">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-12" />
          </header>
          <ol className="flex flex-col gap-3">
            {Array.from({ length: TIMELINE_SKELETON_ROWS }, (_, i) => (
              <li key={i} className="relative pl-6">
                <span
                  aria-hidden="true"
                  className="absolute left-[7px] top-0 h-full w-px bg-slate-200"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-4 h-3 w-3 rounded-full border-2 border-slate-200 bg-white"
                />
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="mt-3 h-3 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

export function Dossier({
  person,
  peopleByKey,
  onSelectPerson,
  loading,
  hasSelection,
  selectedFallbackName,
  hasActiveFilters,
  onClearFilters,
}: DossierProps) {
  if (loading && !person) {
    return <DossierSkeleton />;
  }

  if (!person) {
    if (hasSelection && hasActiveFilters) {
      const label = selectedFallbackName?.trim() || 'this person';
      return (
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            icon={FilterX}
            title={`No matching records for ${label} under current filters`}
            description="Adjust or clear the filters to bring this person's case file back into view."
            action={
              onClearFilters ? (
                <Button variant="secondary" size="sm" onClick={onClearFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        </main>
      );
    }
    return (
      <main className="flex-1 overflow-y-auto">
        <EmptyState
          icon={FileSearch}
          title="Select a suspect on the left to open their case file"
          description="Each dossier gathers every check-in, message, sighting, note and tip tied to a person into a single timeline. The most suspicious one is right at the top."
        />
      </main>
    );
  }

  const recordCount = person.records.length;

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <header className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold uppercase tracking-wide text-indigo-700"
          >
            {initials(person.displayName)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{person.displayName}</h2>
            <p className="text-xs text-slate-500">
              Case file · {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </p>
          </div>
        </header>
        <SummaryCards person={person} peopleByKey={peopleByKey} onSelectPerson={onSelectPerson} />
        <Timeline records={person.records} />
      </div>
    </main>
  );
}
