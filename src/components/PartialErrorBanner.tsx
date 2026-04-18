import { AlertTriangle, RotateCw } from 'lucide-react';

import { FORM_BY_SOURCE } from '../config/forms';
import type { SourceStatus } from '../data/types';
import { cn } from '../utils/cn';

export interface PartialErrorBannerProps {
  sourceStatuses: readonly SourceStatus[];
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}

function buildFailedLabel(sourceStatuses: readonly SourceStatus[]): string {
  const labels = sourceStatuses
    .filter((s) => s.state === 'error')
    .map((s) => FORM_BY_SOURCE[s.sourceType]?.label ?? s.sourceType);
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

export function PartialErrorBanner({
  sourceStatuses,
  onRetry,
  retrying,
  className,
}: PartialErrorBannerProps) {
  const failedLabel = buildFailedLabel(sourceStatuses);
  if (failedLabel.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex h-8 shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-6 text-[11px] text-amber-900',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="truncate">
          <span className="font-semibold">Some sources failed to load.</span>{' '}
          <span className="text-amber-800">{failedLabel}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        aria-disabled={retrying || undefined}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold text-amber-800 transition-colors',
          'hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
          retrying && 'cursor-not-allowed opacity-60',
        )}
      >
        <RotateCw className={cn('h-3 w-3', retrying && 'animate-spin')} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
