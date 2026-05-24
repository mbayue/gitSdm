import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-white/10 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder:text-zinc-500',
        'focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20',
        'transition-all',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
