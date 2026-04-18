import { TopBar } from './components/TopBar';
import { PeoplePane } from './components/PeoplePane';
import { Dossier } from './components/Dossier';
import { useInvestigation } from './hooks/useInvestigation';
import type { InvestigationStatus } from './data/types';

const STATUS_LABEL: Record<InvestigationStatus, string> = {
  loading: 'Loading',
  partial: 'Partial',
  ready: 'Ready',
  error: 'Error',
};

const STATUS_DOT: Record<InvestigationStatus, string> = {
  loading: 'bg-slate-400',
  partial: 'bg-amber-500',
  ready: 'bg-emerald-500',
  error: 'bg-rose-500',
};

export default function App() {
  const { status, records, peopleSorted, sourceStatuses } = useInvestigation();
  const successSources = sourceStatuses.filter((s) => s.state === 'success').length;

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar />
      {/* Temporary Step-2 validation strip. Removed in Step 3. */}
      <div
        role="status"
        className="flex h-8 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-6 text-[11px] text-slate-500"
      >
        <span className="inline-flex items-center gap-1.5 font-medium uppercase tracking-wider">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
            aria-hidden="true"
          />
          {STATUS_LABEL[status]}
        </span>
        <span className="text-slate-300">·</span>
        <span className="font-mono">Records: {records.length}</span>
        <span className="text-slate-300">·</span>
        <span className="font-mono">People: {peopleSorted.length}</span>
        <span className="text-slate-300">·</span>
        <span className="font-mono">
          Sources: {successSources}/{sourceStatuses.length}
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <PeoplePane />
        <Dossier />
      </div>
    </div>
  );
}
