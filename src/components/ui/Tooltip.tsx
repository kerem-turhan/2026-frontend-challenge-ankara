/**
 * Lightweight Tailwind-only tooltip. Opens on pointer hover and on keyboard
 * focus, so it stays accessible when navigating without a mouse. We intentionally
 * skip a portal: every consumer in this app sits inside a card with enough
 * vertical headroom for an absolute popover, and avoiding a portal keeps the
 * focus order natural.
 */

import { useId, useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: ReactNode;
  children: (api: {
    triggerProps: {
      'aria-describedby': string | undefined;
      onMouseEnter: () => void;
      onMouseLeave: () => void;
      onFocus: () => void;
      onBlur: () => void;
    };
    open: boolean;
  }) => ReactNode;
  className?: string;
  align?: 'start' | 'end';
}

export function Tooltip({ content, children, className, align = 'end' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const triggerProps = {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  return (
    <span className={cn('relative inline-flex', className)}>
      {children({ triggerProps, open })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute top-full z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 text-left text-[11px] leading-relaxed text-slate-600 shadow-lg transition-opacity',
          align === 'end' ? 'right-0' : 'left-0',
          open ? 'opacity-100' : 'invisible opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
