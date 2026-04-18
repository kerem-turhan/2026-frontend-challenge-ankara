import { Users } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

export function PeoplePane() {
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Suspects
          </p>
          <p className="text-sm font-semibold text-slate-900">Loading people…</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          icon={Users}
          title="People will appear here"
          description="Once the case data loads, suspects are listed with a suspicion score and the records that link them to Podo."
        />
      </div>
    </aside>
  );
}
