import { Users } from 'lucide-react';

import type { InvestigationStatus, Person } from '../data/types';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { PersonListItem } from './PersonListItem';

export interface PeoplePaneProps {
  people: readonly Person[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  status: InvestigationStatus;
}

const SKELETON_ROWS = 6;

export function PeoplePane({ people, selectedKey, onSelect, status }: PeoplePaneProps) {
  const count = people.length;
  const isInitialLoading = status === 'loading' && count === 0;
  const isEmptyReady = count === 0 && status !== 'loading';

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Suspects
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {isInitialLoading
              ? 'Loading people…'
              : count === 0
                ? 'No people yet'
                : `${count} ${count === 1 ? 'person' : 'people'}`}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
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
          <EmptyState
            icon={Users}
            title="No suspects to show"
            description="Once the case data loads, people linked to Podo are listed here — the most suspicious at the top."
          />
        ) : (
          <ul>
            {people.map((person) => (
              <li key={person.key}>
                <PersonListItem
                  person={person}
                  selected={person.key === selectedKey}
                  onClick={() => onSelect(person.key)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
