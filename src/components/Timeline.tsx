import { useMemo } from 'react';
import { Clock } from 'lucide-react';

import type { BaseRecord } from '../data/types';
import { EmptyState } from './ui/EmptyState';
import { TimelineItem } from './TimelineItem';

export interface TimelineProps {
  records: readonly BaseRecord[];
}

export function Timeline({ records }: TimelineProps) {
  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      const aTime = Date.parse(a.occurredAt);
      const bTime = Date.parse(b.occurredAt);
      const aValid = Number.isFinite(aTime);
      const bValid = Number.isFinite(bTime);
      if (aValid && bValid) return bTime - aTime;
      if (aValid) return -1;
      if (bValid) return 1;
      return 0;
    });
  }, [records]);

  return (
    <section aria-labelledby="timeline-heading" className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h3
          id="timeline-heading"
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
        >
          Timeline · newest first
        </h3>
        <span className="text-[11px] tabular-nums text-slate-400">
          {sorted.length} {sorted.length === 1 ? 'record' : 'records'}
        </span>
      </header>
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white">
          <EmptyState
            icon={Clock}
            title="No records linked to this person."
            description="When new records appear across the five sources, they will show up here in chronological order."
          />
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {sorted.map((record) => (
            <TimelineItem key={`${record.sourceType}:${record.id}`} record={record} />
          ))}
        </ol>
      )}
    </section>
  );
}
