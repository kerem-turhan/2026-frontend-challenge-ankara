import type { ChangeEvent, Ref } from 'react';
import { Compass, RotateCw, Search, Sparkles, X } from 'lucide-react';

import { cn } from '../utils/cn';
import { Input } from './ui/Input';

export interface TopBarProps {
  query: string;
  onQueryChange: (next: string) => void;
  onlyPodo: boolean;
  onOnlyPodoChange: (next: boolean) => void;
  onRefresh: () => void;
  refreshing?: boolean;
  refreshDisabled?: boolean;
  searchInputRef?: Ref<HTMLInputElement>;
}

export function TopBar({
  query,
  onQueryChange,
  onlyPodo,
  onOnlyPodoChange,
  onRefresh,
  refreshing,
  refreshDisabled,
  searchInputRef,
}: TopBarProps) {
  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  const handleClearQuery = () => {
    onQueryChange('');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:gap-6 sm:px-6">
      <div className="hidden items-center gap-3 sm:flex">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"
          aria-hidden="true"
        >
          <Compass className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Investigation Dashboard
          </p>
          <h1 className="text-sm font-semibold text-slate-900">
            Missing Podo — Case File <span className="text-slate-400">· Ankara</span>
          </h1>
        </div>
      </div>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white sm:hidden"
        aria-hidden="true"
      >
        <Compass className="h-5 w-5" />
      </div>
      <div className="flex flex-1 items-center gap-2 sm:ml-auto sm:flex-initial sm:gap-3">
        <Input
          type="search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search person, location, or content"
          aria-label="Search records"
          inputRef={searchInputRef}
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          rightSlot={
            query.length > 0 ? (
              <button
                type="button"
                onClick={handleClearQuery}
                aria-label="Clear search"
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ) : undefined
          }
          className="min-w-0 flex-1 sm:w-72 sm:flex-initial"
        />
        <button
          type="button"
          role="switch"
          aria-checked={onlyPodo}
          aria-label="Only show records that mention Podo"
          onClick={() => onOnlyPodoChange(!onlyPodo)}
          className={cn(
            'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-colors sm:px-3',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
            onlyPodo
              ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          <Sparkles
            className={cn('h-3.5 w-3.5', onlyPodo ? 'text-amber-600' : 'text-slate-400')}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Only mentions Podo</span>
          <span className="sm:hidden">Podo</span>
          <span
            aria-hidden="true"
            className={cn(
              'relative ml-1 inline-flex h-4 w-7 items-center rounded-full transition-colors',
              onlyPodo ? 'bg-amber-500' : 'bg-slate-200',
            )}
          >
            <span
              className={cn(
                'absolute inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform',
                onlyPodo ? 'translate-x-3.5' : 'translate-x-0.5',
              )}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshDisabled || refreshing}
          aria-label="Refresh case files"
          className={cn(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors',
            'hover:bg-slate-50 hover:text-slate-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <RotateCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
