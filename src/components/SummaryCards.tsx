import { Info } from 'lucide-react';

import type { Person, SourceType, SuspicionBreakdown } from '../data/types';
import { cn } from '../utils/cn';
import { formatAbsoluteLong, formatRelative } from '../utils/date';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Tooltip } from './ui/Tooltip';

export interface SummaryCardsProps {
  person: Person;
  peopleByKey: ReadonlyMap<string, Person>;
  onSelectPerson: (key: string) => void;
}

const SOURCE_ORDER: readonly SourceType[] = ['sighting', 'message', 'checkin', 'note', 'tip'];

const SOURCE_LABEL: Record<SourceType, string> = {
  checkin: 'Check-ins',
  message: 'Messages',
  sighting: 'Sightings',
  note: 'Notes',
  tip: 'Tips',
};

const EYEBROW = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500';

function pluralS(count: number): string {
  return count === 1 ? '' : 's';
}

interface BreakdownLine {
  label: string;
  delta: string;
  positive: boolean;
}

function buildBreakdownLines(b: SuspicionBreakdown): readonly BreakdownLine[] {
  const lines: BreakdownLine[] = [];
  if (b.sightingsWithPodo > 0)
    lines.push({
      label: `${b.sightingsWithPodo} sighting${pluralS(b.sightingsWithPodo)} with Podo`,
      delta: `+${b.sightingsWithPodo * 3}`,
      positive: true,
    });
  if (b.messagesWithPodo > 0)
    lines.push({
      label: `${b.messagesWithPodo} message${pluralS(b.messagesWithPodo)} with Podo`,
      delta: `+${b.messagesWithPodo * 2}`,
      positive: true,
    });
  if (b.tipsAboutThem > 0)
    lines.push({
      label: `${b.tipsAboutThem} anonymous tip${pluralS(b.tipsAboutThem)}`,
      delta: `+${b.tipsAboutThem * 2}`,
      positive: true,
    });
  if (b.checkinsNearPodo > 0)
    lines.push({
      label: `${b.checkinsNearPodo} check-in${pluralS(b.checkinsNearPodo)} near Podo`,
      delta: `+${b.checkinsNearPodo}`,
      positive: true,
    });
  if (b.notesWithPodo > 0)
    lines.push({
      label: `${b.notesWithPodo} note${pluralS(b.notesWithPodo)} mentioning Podo`,
      delta: `+${b.notesWithPodo}`,
      positive: true,
    });
  if (b.unrelatedPenalty > 0)
    lines.push({
      label: 'Unrelated-record penalty',
      delta: `-${b.unrelatedPenalty}`,
      positive: false,
    });
  return lines;
}

function suspicionBarClass(score: number): string {
  if (score >= 67) return 'bg-rose-500';
  if (score >= 34) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function SummaryCards({ person, peopleByKey, onSelectPerson }: SummaryCardsProps) {
  const score = Math.max(0, Math.min(100, person.suspicionScore));
  const relative = formatRelative(person.latestSeenAt);
  const absolute = formatAbsoluteLong(person.latestSeenAt);
  const totalRecords = person.records.length;

  const breakdownLines = buildBreakdownLines(person.suspicionBreakdown);
  const barClass = suspicionBarClass(score);

  const tooltipContent =
    breakdownLines.length === 0 ? (
      <span>No contributing signals yet.</span>
    ) : (
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          How this score is built
        </p>
        <ul className="flex flex-col gap-0.5">
          {breakdownLines.map((line) => (
            <li key={line.label} className="flex items-baseline justify-between gap-2">
              <span className="text-slate-600">{line.label}</span>
              <span
                className={cn(
                  'shrink-0 tabular-nums font-medium',
                  line.positive ? 'text-indigo-600' : 'text-rose-600',
                )}
              >
                {line.delta}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[10px] text-slate-400">
          Raw points are then normalised against the highest score in the dataset.
        </p>
      </div>
    );

  const visibleOthers = person.otherPeople.slice(0, 3);
  const extraOthers = Math.max(0, person.otherPeople.length - visibleOthers.length);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <div className="flex items-start justify-between gap-2">
          <p className={EYEBROW}>Suspicion score</p>
          <Tooltip content={tooltipContent}>
            {({ triggerProps, open }) => (
              <button
                type="button"
                aria-label="Show suspicion score breakdown"
                aria-expanded={open}
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors',
                  'hover:bg-slate-100 hover:text-slate-600',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
                )}
                {...triggerProps}
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </Tooltip>
        </div>
        <p className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tabular-nums text-slate-900">{score}</span>
          <span className="text-xs text-slate-500">/ 100</span>
        </p>
        <div
          aria-hidden="true"
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <span
            className={cn('block h-full rounded-full transition-colors', barClass)}
            style={{ width: `${score}%` }}
          />
        </div>
      </Card>

      <Card>
        <p className={EYEBROW}>Last seen</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {relative ?? 'No dated records yet'}
        </p>
        <p className="mt-1 text-xs text-slate-500" title={absolute ?? undefined}>
          {person.lastLocation ? (
            <span className="font-medium text-slate-700">{person.lastLocation}</span>
          ) : (
            <span className="text-slate-400">Location unknown</span>
          )}
          {relative && absolute ? (
            <>
              <span className="px-1 text-slate-300">·</span>
              {absolute}
            </>
          ) : null}
        </p>
      </Card>

      <Card>
        <p className={EYEBROW}>Last seen with</p>
        {visibleOthers.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">No one else is linked yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleOthers.map((key) => {
              const other = peopleByKey.get(key);
              const label = other?.displayName ?? key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectPerson(key)}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                >
                  {label}
                </button>
              );
            })}
            {extraOthers > 0 ? (
              <span
                className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200"
                title={`${extraOthers} more ${extraOthers === 1 ? 'person' : 'people'} linked to this suspect`}
              >
                +{extraOthers} more
              </span>
            ) : null}
          </div>
        )}
      </Card>

      <Card>
        <p className={EYEBROW}>Records</p>
        <p className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-semibold tabular-nums text-slate-900">{totalRecords}</span>
          <span className="text-xs text-slate-500">
            across {SOURCE_ORDER.filter((s) => person.sourceCounts[s] > 0).length || 0} source
            {SOURCE_ORDER.filter((s) => person.sourceCounts[s] > 0).length === 1 ? '' : 's'}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SOURCE_ORDER.map((source) => {
            const count = person.sourceCounts[source];
            if (count === 0) return null;
            return (
              <Badge key={source} tone={source} className="tabular-nums">
                {SOURCE_LABEL[source]} · {count}
              </Badge>
            );
          })}
          {totalRecords === 0 ? <p className="text-xs text-slate-400">No records yet.</p> : null}
        </div>
      </Card>
    </section>
  );
}
