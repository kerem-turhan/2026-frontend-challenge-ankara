import { Fragment, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { isValid, parseISO } from 'date-fns';

import type { BaseRecord, SourceType } from '../data/types';
import { cn } from '../utils/cn';
import { formatAbsoluteLong, formatRelative } from '../utils/date';
import { Badge } from './ui/Badge';

export interface TimelineItemProps {
  record: BaseRecord;
}

const SOURCE_LABEL: Record<SourceType, string> = {
  checkin: 'Check-in',
  message: 'Message',
  sighting: 'Sighting',
  note: 'Note',
  tip: 'Tip',
};

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-slate-900">{children}</span>;
}

function joinSentence(parts: ReactNode[]): ReactNode {
  const result: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i > 0) result.push(' ');
    result.push(<Fragment key={i}>{part}</Fragment>);
  });
  return result;
}

function buildSentence(record: BaseRecord): ReactNode {
  const { personName, otherPersonName, location, sourceType } = record;
  const subject = personName ? (
    <Strong>{personName}</Strong>
  ) : (
    <span className="italic text-slate-400">Someone</span>
  );
  const other = otherPersonName ? <Strong>{otherPersonName}</Strong> : null;
  const place = location ? <Strong>{location}</Strong> : null;

  switch (sourceType) {
    case 'checkin':
      return joinSentence(place ? [subject, 'checked in at', place] : [subject, 'checked in']);
    case 'message':
      return joinSentence(other ? [subject, 'messaged', other] : [subject, 'sent a message']);
    case 'sighting': {
      const parts: ReactNode[] = [subject, other ? 'saw' : 'reported a sighting'];
      if (other) parts.push(other);
      if (place) parts.push('at', place);
      return joinSentence(parts);
    }
    case 'note':
      return joinSentence(other ? [subject, 'wrote about', other] : [subject, 'left a note']);
    case 'tip': {
      const parts: ReactNode[] = ['Anonymous tip'];
      if (other) parts.push('about', other);
      if (place) parts.push('at', place);
      return joinSentence(parts);
    }
    default:
      return joinSentence([subject, 'added a record']);
  }
}

function shouldShowLocationExtra(record: BaseRecord): boolean {
  if (!record.location) return false;
  return record.sourceType === 'message' || record.sourceType === 'note';
}

export function TimelineItem({ record }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const relative = formatRelative(record.occurredAt);
  const absolute = formatAbsoluteLong(record.occurredAt);
  const parsed = record.occurredAt ? parseISO(record.occurredAt) : null;
  const dateTimeAttr = parsed && isValid(parsed) ? parsed.toISOString() : undefined;
  const hasText = typeof record.text === 'string' && record.text.length > 0;
  const hasExtra = hasText || shouldShowLocationExtra(record);

  return (
    <li className="relative pl-6">
      <span aria-hidden="true" className="absolute left-[7px] top-0 h-full w-px bg-slate-200" />
      <span
        aria-hidden="true"
        className="absolute left-0 top-4 h-3 w-3 rounded-full border-2 border-slate-200 bg-white"
      />
      <button
        type="button"
        onClick={hasExtra ? () => setExpanded((v) => !v) : undefined}
        aria-expanded={hasExtra ? expanded : undefined}
        aria-disabled={hasExtra ? undefined : true}
        tabIndex={hasExtra ? 0 : -1}
        className={cn(
          'group flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors',
          hasExtra
            ? 'hover:border-slate-300 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
            : 'cursor-default',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={record.sourceType}>{SOURCE_LABEL[record.sourceType]}</Badge>
            {record.mentionsPodo ? <Badge tone="amber">mentions Podo</Badge> : null}
          </div>
          <time
            {...(dateTimeAttr ? { dateTime: dateTimeAttr } : {})}
            title={absolute ?? undefined}
            className="shrink-0 text-[11px] text-slate-500"
          >
            {relative ?? <span className="italic text-slate-400">Unknown time</span>}
          </time>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{buildSentence(record)}</p>
        {hasText ? (
          <p
            className={cn(
              'whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-500',
              !expanded && 'line-clamp-2',
            )}
          >
            {record.text}
          </p>
        ) : null}
        {expanded ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            {shouldShowLocationExtra(record) && record.location ? (
              <span>
                <span className="text-slate-400">Location · </span>
                <span className="font-medium text-slate-700">{record.location}</span>
              </span>
            ) : null}
            {absolute ? (
              <span>
                <span className="text-slate-400">When · </span>
                <span className="font-medium text-slate-700">{absolute}</span>
              </span>
            ) : null}
          </div>
        ) : null}
        {hasExtra ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-slate-500">
            <ChevronDown
              aria-hidden="true"
              className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
            />
            {expanded ? 'Hide details' : 'Show details'}
          </span>
        ) : null}
      </button>
    </li>
  );
}
