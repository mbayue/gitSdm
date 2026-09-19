import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { ThemeSync } from '@/components/theme/ThemeSync';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MotionConfig } from 'framer-motion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (
          error instanceof Error &&
          (error.message.includes('404') || error.message.toLowerCase().includes('not found'))
        ) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const reducedMotion = useMotionPreference();
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [reducedMotion]);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      {/* Components apply the reactive preference; Motion's built-in flag is mount-only. */}
      <MotionConfig reducedMotion="never">
        <TooltipProvider>{children}</TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
