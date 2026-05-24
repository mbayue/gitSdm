import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover, onClick }: GlassCardProps) {
  const classes = cn(
    'glass rounded-xl p-5 shadow-glow',
    onClick && 'cursor-pointer',
    className,
  );

  if (onClick || hover) {
    return (
      <motion.div
        className={classes}
        whileHover={hover ? { y: -2 } : undefined}
        whileTap={onClick ? { scale: 0.99 } : undefined}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={classes}>{children}</div>;
}
