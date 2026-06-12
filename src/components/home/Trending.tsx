import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { fetchTrending } from '@/lib/apiClient';
import { useNavigate } from 'react-router-dom';
import { formatStars } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface TrendingProps {
  onSelect: (url: string) => void;
}

export function Trending({ onSelect }: TrendingProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trending'],
    queryFn: fetchTrending,
  });
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState<string | null>(null);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="mb-8 text-center text-2xl font-semibold text-white">Trending repositories</h2>
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {error && (
        <p className="text-center text-sm text-zinc-500">Could not load trending repos</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((repo, i) => (
          <motion.div
            key={repo.fullName}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard
              hover
              onClick={async () => {
                // show a brief confirmation/loading state before navigating
                setNavigating(repo.fullName);
                // keep the UX snappy while ensuring user sees the feedback
                await new Promise((r) => setTimeout(r, 220));
                onSelect?.(repo.url);
                navigate(`/${repo.owner}/${repo.repo}`);
              }}
              className="h-full cursor-pointer relative"
            >
              {navigating === repo.fullName && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/40">
                  <div className="flex items-center gap-2 rounded px-3 py-1 text-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white/80" />
                    <span className="text-sm text-white">Analyzing...</span>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-mono text-sm font-medium text-white">{repo.fullName}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {repo.description ?? 'No description'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
                  <Star className="h-3 w-3 text-amber-400" />
                  {formatStars(repo.stars)}
                </div>
              </div>
              {repo.language && (
                <span className="mt-3 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                  {repo.language}
                </span>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
