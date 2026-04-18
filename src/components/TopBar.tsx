import { Compass, Search, Sparkles } from 'lucide-react';

import { Input } from './ui/Input';

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-6 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
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
      <div className="ml-auto flex items-center gap-3" aria-hidden="true">
        <Input
          type="text"
          readOnly
          tabIndex={-1}
          placeholder="Search people, locations, messages"
          leftIcon={<Search className="h-4 w-4" />}
          className="w-72 cursor-default opacity-80"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-pressed={false}
          className="inline-flex h-10 cursor-default items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 opacity-80"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
          Only mentions Podo
        </button>
      </div>
    </header>
  );
}
