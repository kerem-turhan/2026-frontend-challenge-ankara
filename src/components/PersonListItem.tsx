import type { Person, SourceType } from '../data/types';
import { cn } from '../utils/cn';
import { formatRelative } from '../utils/date';
import { initials } from '../utils/text';

export interface PersonListItemProps {
  person: Person;
  selected: boolean;
  onClick: () => void;
}

const SOURCE_ORDER: readonly SourceType[] = ['sighting', 'message', 'checkin', 'note', 'tip'];

const SOURCE_DOT_CLASS: Record<SourceType, string> = {
  checkin: 'bg-sky-500',
  message: 'bg-violet-500',
  sighting: 'bg-amber-500',
  note: 'bg-slate-400',
  tip: 'bg-rose-500',
};

const SOURCE_LABEL: Record<SourceType, string> = {
  checkin: 'check-ins',
  message: 'messages',
  sighting: 'sightings',
  note: 'notes',
  tip: 'tips',
};

export function PersonListItem({ person, selected, onClick }: PersonListItemProps) {
  const relative = formatRelative(person.latestSeenAt);
  const location = person.lastLocation;
  const score = Math.max(0, Math.min(100, person.suspicionScore));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors',
        'hover:bg-slate-50/70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300',
        selected && 'bg-slate-50',
      )}
    >
      {selected ? (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
      ) : null}
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold uppercase tracking-wide text-indigo-700"
      >
        {initials(person.displayName)}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium text-slate-900',
            selected && 'text-indigo-800',
          )}
        >
          {person.displayName}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
          {relative ? <span className="truncate">{relative}</span> : null}
          {relative && location ? <span className="text-slate-300">·</span> : null}
          {location ? <span className="truncate">{location}</span> : null}
          {!relative && !location ? <span className="text-slate-400">No records yet</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5" title={`Suspicion score ${score} out of 100`}>
          <span className="text-[10px] font-semibold tabular-nums text-slate-600">{score}</span>
          <span
            aria-hidden="true"
            className="relative h-1.5 w-10 overflow-hidden rounded-full bg-slate-100"
          >
            <span
              className="absolute left-0 top-0 h-full rounded-full bg-indigo-500"
              style={{ width: `${score}%` }}
            />
          </span>
        </div>
        <div className="flex items-center gap-1">
          {SOURCE_ORDER.map((source) => {
            const count = person.sourceCounts[source];
            if (count === 0) return null;
            return (
              <span
                key={source}
                title={`${count} ${SOURCE_LABEL[source]}`}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-600"
              >
                <span
                  aria-hidden="true"
                  className={cn('inline-block h-1.5 w-1.5 rounded-full', SOURCE_DOT_CLASS[source])}
                />
                <span className="tabular-nums">{count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </button>
  );
}
