import { motion, HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}

export function GlowButton({
  children,
  className,
  variant = 'primary',
  loading,
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
        variant === 'primary' &&
          'glow-btn bg-[#238636] text-white hover:bg-[#2ea043] disabled:opacity-50 border border-[rgba(240,246,252,0.1)]',
        variant === 'ghost' &&
          'glass text-zinc-300 hover:text-white hover:border-white/20 disabled:opacity-50',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </motion.button>
  );
}
