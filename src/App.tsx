import { useCallback, useEffect, useState } from 'react';

import { TopBar } from './components/TopBar';
import { PeoplePane } from './components/PeoplePane';
import { Dossier } from './components/Dossier';
import { useInvestigation } from './hooks/useInvestigation';

const HASH_PERSON_KEY = 'person';

function readHashPersonKey(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;
  try {
    const params = new URLSearchParams(hash);
    const raw = params.get(HASH_PERSON_KEY);
    if (!raw) return null;
    const value = raw.trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeHashPersonKey(key: string | null): void {
  if (typeof window === 'undefined') return;
  const next = key ? `#${HASH_PERSON_KEY}=${encodeURIComponent(key)}` : ' ';
  window.history.replaceState(null, '', next);
}

export default function App() {
  const { status, peopleByKey, peopleSorted } = useInvestigation();
  const [selectedPersonKey, setSelectedPersonKey] = useState<string | null>(() =>
    readHashPersonKey(),
  );

  useEffect(() => {
    writeHashPersonKey(selectedPersonKey);
  }, [selectedPersonKey]);

  const selectedPerson = selectedPersonKey ? peopleByKey.get(selectedPersonKey) : undefined;

  const handleSelectPerson = useCallback((key: string) => {
    setSelectedPersonKey(key);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <PeoplePane
          people={peopleSorted}
          selectedKey={selectedPersonKey}
          onSelect={handleSelectPerson}
          status={status}
        />
        <Dossier
          person={selectedPerson}
          peopleByKey={peopleByKey}
          onSelectPerson={handleSelectPerson}
        />
      </div>
    </div>
  );
}
