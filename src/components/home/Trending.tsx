import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchTrending } from '@/lib/apiClient';
import { formatStars } from '@/lib/utils';

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
    <section id="examples" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 py-12 sm:py-20">
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#e6edf3] mb-2">Example repositories</h2>
        <p className="text-sm text-[#8b949e]">Select a project to explore its architecture.</p>
      </div>

      {isLoading && (
        <div className="border border-[rgba(240,246,252,0.1)] rounded-lg divide-y divide-[rgba(240,246,252,0.1)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#161b22]/50 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded border border-[#f85149]/20 bg-[#f85149]/5 text-center text-xs text-[#f85149]">
          Could not load trending repositories.
        </div>
      )}

      <div className="border border-[rgba(240,246,252,0.1)] rounded-lg overflow-hidden divide-y divide-[rgba(240,246,252,0.1)]">
        {data?.slice(0, 5).map((repo) => (
          <div
            key={repo.fullName}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 p-4 bg-[#161b22] hover:bg-[#1c2128] transition-colors cursor-pointer"
            onClick={async () => {
              setNavigating(repo.fullName);
              await new Promise((r) => setTimeout(r, 220));
              onSelect?.(repo.url);
              navigate(`/${repo.owner}/${repo.repo}`);
            }}
          >
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-sm font-bold text-[#e6edf3] font-mono truncate">
                  {repo.fullName}
                </h3>
                {repo.language && (
                  <span className="text-[10px] text-[#8b949e] border border-[rgba(240,246,252,0.1)] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0">
                    {repo.language}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8b949e] line-clamp-2 sm:line-clamp-1 pr-2">
                {repo.description ?? 'No description available'}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 mt-2 sm:mt-0">
              <div className="flex items-center gap-1.5 text-xs text-[#8b949e] font-mono">
                <Star className="h-3.5 w-3.5" />
                <span>{formatStars(repo.stars)}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-[rgba(240,246,252,0.1)] bg-[#0d1117] text-[#e6edf3] hover:bg-[#1c2128] text-[10px] font-bold uppercase tracking-wider px-4 sm:px-3 w-auto"
              >
                {navigating === repo.fullName ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center w-full">
	        <a href="https://github.com/trending" target="_blank" rel="noopener noreferrer" className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors underline decoration-[rgba(240,246,252,0.2)] underline-offset-4 px-4 py-2 text-center whitespace-normal">
          View more examples on GitHub
        </a>
      </div>
    </section>
  );
}
