import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { fetchTrending } from '@/lib/apiClient';
import { useNavigate } from 'react-router-dom';
import { formatStars } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
    <section id="trending" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-[#22d3ee] mb-3 block">Trending</span>
        <h2 className="text-3xl font-bold text-[#f8fafc] sm:text-4xl">Popular repositories</h2>
        <p className="mt-3 text-[#a1a1aa] max-w-md mx-auto">
          Explore trending open-source projects analyzed by the community.
        </p>
      </motion.div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl bg-[#161622]" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-[#a1a1aa]">Could not load trending repos</p>
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
            <Card
              className="group h-full p-5 border-[#272233] bg-[#0f0f17] hover:border-[#8b5cf6]/30 hover:-translate-y-0.5 transition-all cursor-pointer relative"
              onClick={async () => {
                setNavigating(repo.fullName);
                await new Promise((r) => setTimeout(r, 220));
                onSelect?.(repo.url);
                navigate(`/${repo.owner}/${repo.repo}`);
              }}
            >
              {navigating === repo.fullName && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#050509]/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-[#8b5cf6]" />
                    <span className="text-xs text-[#f8fafc]">Analyzing...</span>
                  </div>
                </div>
              )}

              {/* Header row: name + stars */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-mono text-sm font-semibold text-[#f8fafc] group-hover:text-[#c4b5fd] transition-colors truncate">
                  {repo.fullName}
                </h3>
                <div className="flex shrink-0 items-center gap-1 text-xs text-[#fbbf24]">
                  <Star className="h-3 w-3" />
                  <span className="font-mono">{formatStars(repo.stars)}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#a1a1aa] leading-relaxed line-clamp-2 mb-3">
                {repo.description ?? 'No description available'}
              </p>

              {/* Footer: language badge + CTA */}
              <div className="flex items-center justify-between mt-auto">
                {repo.language ? (
                  <Badge variant="secondary" className="text-[10px] border-[#272233] bg-[#161622] text-[#a1a1aa]">
                    {repo.language}
                  </Badge>
                ) : (
                  <span />
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  className="gap-1 text-[10px] text-[#8b5cf6] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Analyze
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
