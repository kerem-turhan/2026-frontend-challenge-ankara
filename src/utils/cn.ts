export type ClassValue = string | number | false | null | undefined;

/**
 * Tiny class-name joiner. Filters out falsy values so we can write
 * `cn('base', isActive && 'bg-indigo-50')` without pulling in `clsx`.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
