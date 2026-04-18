import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  inputRef?: Ref<HTMLInputElement> | undefined;
}

export function Input({ className, leftIcon, rightSlot, inputRef, ...rest }: InputProps) {
  return (
    <div
      className={cn(
        'group flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3',
        'focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100',
        'transition-colors',
        className,
      )}
    >
      {leftIcon ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-400">
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={inputRef}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        {...rest}
      />
      {rightSlot ? <div className="flex shrink-0 items-center">{rightSlot}</div> : null}
    </div>
  );
}
