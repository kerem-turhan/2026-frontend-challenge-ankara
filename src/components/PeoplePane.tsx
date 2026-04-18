import { useCallback, useEffect, useRef } from 'react';
import { FilterX, Users } from 'lucide-react';

import type { InvestigationStatus, Person, SourceType } from '../data/types';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { PersonListItem } from './PersonListItem';
import { SourceFilters } from './SourceFilters';

export interface PeoplePaneProps {
  people: readonly Person[];
  totalPeople: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  status: InvestigationStatus;
  sourceTypes: ReadonlySet<SourceType>;
  onToggleSource: (source: SourceType) => void;
  onSelectAllSources: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const SKELETON_ROWS = 8;

export function PeoplePane({
  people,
  totalPeople,
  selectedKey,
  onSelect,
  status,
  sourceTypes,
  onToggleSource,
  onSelectAllSources,
  hasActiveFilters,
  onClearFilters,
}: PeoplePaneProps) {
  const count = people.length;
  const isInitialLoading = status === 'loading' && totalPeople === 0;
  const isEmptyReady = count === 0 && status !== 'loading';
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const registerItemRef = useCallback((key: string, el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(key, el);
    } else {
      itemRefs.current.delete(key);
    }
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    const el = itemRefs.current.get(selectedKey);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
    if (
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.tagName !== 'INPUT' &&
      document.activeElement.tagName !== 'TEXTAREA'
    ) {
      el.focus({ preventScroll: true });
    }
  }, [selectedKey]);

  return (
    <aside
      aria-label="Suspects"
      className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:h-full lg:w-[360px] lg:border-b-0 lg:border-r"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Suspects
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {isInitialLoading
                ? 'Loading people…'
                : totalPeople === 0
                  ? 'No people yet'
                  : hasActiveFilters
                    ? `${count} of ${totalPeople} ${totalPeople === 1 ? 'person' : 'people'}`
                    : `${count} ${count === 1 ? 'person' : 'people'}`}
            </p>
          </div>
        </div>
        <SourceFilters
          sourceTypes={sourceTypes}
          onToggle={onToggleSource}
          onSelectAll={onSelectAllSources}
        />
      </div>
      <div className="scrollbar-slim max-h-[40vh] overflow-y-auto lg:max-h-none lg:flex-1">
        {isInitialLoading ? (
          <ul className="divide-y divide-slate-100" aria-busy="true">
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-40" />
                </div>
                <Skeleton className="h-1.5 w-10 rounded-full" />
              </li>
            ))}
          </ul>
        ) : isEmptyReady ? (
          hasActiveFilters ? (
            <EmptyState
              icon={FilterX}
              title="No suspects match your filters"
              description="Try removing a source filter, clearing the Podo toggle or shortening your search."
              action={
                <Button variant="secondary" size="sm" onClick={onClearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No suspects to show"
              description="Once the case data loads, people linked to Podo are listed here — the most suspicious at the top."
            />
          )
        ) : (
          <ul role="list">
            {people.map((person) => (
              <li key={person.key} role="listitem">
                <PersonListItem
                  person={person}
                  selected={person.key === selectedKey}
                  onClick={() => onSelect(person.key)}
                  buttonRef={(el) => registerItemRef(person.key, el)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
