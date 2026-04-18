import type { SourceType } from '../data/types';
import { cn } from '../utils/cn';
import { ALL_SOURCE_TYPES } from '../hooks/useFilters';

export interface SourceFiltersProps {
  sourceTypes: ReadonlySet<SourceType>;
  onToggle: (source: SourceType) => void;
  onSelectAll: () => void;
  className?: string;
}

const SOURCE_LABEL: Record<SourceType, string> = {
  checkin: 'Check-ins',
  message: 'Messages',
  sighting: 'Sightings',
  note: 'Notes',
  tip: 'Tips',
};

const SOURCE_DOT: Record<SourceType, string> = {
  checkin: 'bg-sky-500',
  message: 'bg-violet-500',
  sighting: 'bg-amber-500',
  note: 'bg-slate-400',
  tip: 'bg-rose-500',
};

const ACTIVE_CHIP: Record<SourceType, string> = {
  checkin: 'bg-sky-50 text-sky-800 ring-sky-200',
  message: 'bg-violet-50 text-violet-800 ring-violet-200',
  sighting: 'bg-amber-50 text-amber-900 ring-amber-200',
  note: 'bg-slate-100 text-slate-800 ring-slate-300',
  tip: 'bg-rose-50 text-rose-800 ring-rose-200',
};

const INACTIVE_CHIP =
  'bg-white text-slate-400 ring-slate-200 hover:text-slate-600 hover:ring-slate-300';

export function SourceFilters({
  sourceTypes,
  onToggle,
  onSelectAll,
  className,
}: SourceFiltersProps) {
  const allActive = sourceTypes.size === ALL_SOURCE_TYPES.length;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      role="group"
      aria-label="Filter records by source"
    >
      {ALL_SOURCE_TYPES.map((source) => {
        const active = sourceTypes.has(source);
        return (
          <button
            key={source}
            type="button"
            onClick={() => onToggle(source)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1',
              active ? ACTIVE_CHIP[source] : INACTIVE_CHIP,
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full transition-opacity',
                SOURCE_DOT[source],
                active ? 'opacity-100' : 'opacity-30',
              )}
            />
            {SOURCE_LABEL[source]}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onSelectAll}
        disabled={allActive}
        className={cn(
          'ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1',
          allActive
            ? 'cursor-default text-slate-300'
            : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700',
        )}
        aria-label="Select all sources"
      >
        All
      </button>
    </div>
  );
}
