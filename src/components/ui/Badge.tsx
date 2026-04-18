import type { HTMLAttributes } from 'react';
import type { SourceType } from '../../data/types';
import { cn } from '../../utils/cn';

export type BadgeTone = 'neutral' | 'indigo' | 'amber' | 'rose' | 'emerald' | SourceType;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  checkin: 'bg-sky-50 text-sky-700 ring-sky-100',
  message: 'bg-violet-50 text-violet-700 ring-violet-100',
  sighting: 'bg-amber-50 text-amber-800 ring-amber-100',
  note: 'bg-slate-100 text-slate-700 ring-slate-200',
  tip: 'bg-rose-50 text-rose-700 ring-rose-100',
};

export function Badge({ className, tone = 'neutral', children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ring-1',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
