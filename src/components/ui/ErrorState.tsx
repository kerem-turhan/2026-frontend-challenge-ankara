import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  details?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load the case files. Check your connection and try again.",
  action,
  details,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex h-full min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center',
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
      {details ? (
        <details className="mt-2 max-w-sm text-left text-xs text-slate-400">
          <summary className="cursor-pointer select-none">Technical details</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words text-[11px]">{details}</pre>
        </details>
      ) : null}
    </div>
  );
}
