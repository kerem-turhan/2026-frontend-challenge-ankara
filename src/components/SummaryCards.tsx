import { Info } from 'lucide-react';

import type { Person, SourceType, SuspicionBreakdown } from '../data/types';
import { formatAbsoluteLong, formatRelative } from '../utils/date';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

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

function buildBreakdownSummary(b: SuspicionBreakdown): string {
  const parts: string[] = [];
  if (b.sightingsWithPodo > 0)
    parts.push(`${b.sightingsWithPodo} sighting${pluralS(b.sightingsWithPodo)} with Podo`);
  if (b.messagesWithPodo > 0)
    parts.push(`${b.messagesWithPodo} message${pluralS(b.messagesWithPodo)} with Podo`);
  if (b.tipsAboutThem > 0)
    parts.push(`${b.tipsAboutThem} anonymous tip${pluralS(b.tipsAboutThem)}`);
  if (b.checkinsNearPodo > 0)
    parts.push(`${b.checkinsNearPodo} check-in${pluralS(b.checkinsNearPodo)} near Podo`);
  if (b.notesWithPodo > 0)
    parts.push(`${b.notesWithPodo} note${pluralS(b.notesWithPodo)} mentioning Podo`);
  if (b.unrelatedPenalty > 0) parts.push(`-${b.unrelatedPenalty} unrelated-record penalty`);
  return parts.length > 0 ? parts.join(' · ') : 'No contributing signals yet.';
}

export function SummaryCards({ person, peopleByKey, onSelectPerson }: SummaryCardsProps) {
  const score = Math.max(0, Math.min(100, person.suspicionScore));
  const relative = formatRelative(person.latestSeenAt);
  const absolute = formatAbsoluteLong(person.latestSeenAt);
  const totalRecords = person.records.length;

  const breakdownTitle = buildBreakdownSummary(person.suspicionBreakdown);

  const visibleOthers = person.otherPeople.slice(0, 3);
  const extraOthers = Math.max(0, person.otherPeople.length - visibleOthers.length);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <div className="flex items-start justify-between gap-2">
          <p className={EYEBROW}>Suspicion score</p>
          <span
            aria-label={`Suspicion breakdown: ${breakdownTitle}`}
            title={breakdownTitle}
            className="text-slate-400"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
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
            className="block h-full rounded-full bg-indigo-500"
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
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100 transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
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
