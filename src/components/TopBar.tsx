import { Compass } from 'lucide-react';

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
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
    </header>
  );
}
