import { FileSearch } from 'lucide-react';

import type { Person } from '../data/types';
import { initials } from '../utils/text';
import { EmptyState } from './ui/EmptyState';
import { SummaryCards } from './SummaryCards';
import { Timeline } from './Timeline';

export interface DossierProps {
  person: Person | undefined;
  peopleByKey: ReadonlyMap<string, Person>;
  onSelectPerson: (key: string) => void;
}

export function Dossier({ person, peopleByKey, onSelectPerson }: DossierProps) {
  if (!person) {
    return (
      <main className="flex-1 overflow-y-auto">
        <EmptyState
          icon={FileSearch}
          title="Select a suspect to open their case file"
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
