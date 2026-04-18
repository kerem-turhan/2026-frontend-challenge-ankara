/**
 * Global keyboard shortcuts for the investigation dashboard:
 *   - `/`        focuses the top-bar search input (skipped while typing).
 *   - `Esc`      clears the search query while focus is in the search input.
 *   - `↑` / `↓`  moves the People-list selection (also skipped while typing).
 *   - `Enter`    is handled natively by the focused button (no extra wiring).
 *
 * Lives at App-level so we don't drill props for what is essentially a single
 * window listener. The hook is intentionally tiny: shortcut intent stays in
 * one place, side effects (focus the input, change selection) are delegated
 * to the caller.
 */

import { useEffect, type RefObject } from 'react';

export interface UseKeyboardNavOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  onClearSearch: () => void;
  onMoveSelection: (direction: 1 | -1) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useKeyboardNav({
  searchInputRef,
  onClearSearch,
  onMoveSelection,
}: UseKeyboardNavOptions): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const typing = isTypingTarget(event.target);
      const inSearchInput =
        typing && event.target instanceof HTMLElement && event.target === searchInputRef.current;

      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === 'Escape' && inSearchInput) {
        event.preventDefault();
        onClearSearch();
        return;
      }

      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !typing) {
        event.preventDefault();
        onMoveSelection(event.key === 'ArrowDown' ? 1 : -1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef, onClearSearch, onMoveSelection]);
}
