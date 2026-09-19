import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMotionPreference } from '@/hooks/useMotionPreference';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover, onClick }: GlassCardProps) {
  const reducedMotion = useMotionPreference();
  const classes = cn(
    'glass rounded-xl p-5 shadow-glow',
    onClick && 'cursor-pointer',
    className,
  );

  if (onClick || hover) {
    return (
      <motion.div
        className={classes}
        animate={{ y: 0, scale: 1 }}
        whileHover={hover ? { y: reducedMotion ? 0 : -2 } : undefined}
        whileTap={onClick ? { scale: reducedMotion ? 1 : 0.99 } : undefined}
        transition={reducedMotion ? { duration: 0 } : undefined}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={classes}>{children}</div>;
}
