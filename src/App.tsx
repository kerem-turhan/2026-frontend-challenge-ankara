import { TopBar } from './components/TopBar';
import { PeoplePane } from './components/PeoplePane';
import { Dossier } from './components/Dossier';

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <PeoplePane />
        <Dossier />
      </div>
    </div>
  );
}
