import { FileSearch } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

export function Dossier() {
  return (
    <main className="flex-1 overflow-y-auto">
      <EmptyState
        icon={FileSearch}
        title="Select a suspect to open their case file"
        description="Each dossier gathers every check-in, message, sighting, note and tip tied to a person into a single timeline."
      />
    </main>
  );
}
