import type { RepoMeta, RepoAnalysis } from '@/types';
import { formatStars } from '@/lib/utils';
import { History, Star } from 'lucide-react';

interface HeaderStatsProps {
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
}

export function HeaderStats({ analysis, meta: propsMeta }: HeaderStatsProps) {
  const meta = propsMeta ?? analysis?.meta;
  const totalCommits =
    analysis?.timeline?.reduce((sum, w) => sum + w.count, 0) ??
    analysis?.contributors?.reduce((sum, c) => sum + c.contributions, 0) ??
    0;

  return (
    <div className="hidden md:flex items-center gap-2 select-none shrink-0">
      {totalCommits > 0 && (
        <div className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/[0.04] bg-white/[0.01] text-[10px] font-mono font-medium text-zinc-400">
          <History className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span>{totalCommits.toLocaleString()} commits</span>
        </div>
      )}

      {meta && (
        <a
          href={`https://github.com/${meta.fullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/[0.04] bg-white/[0.01] text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/[0.1] transition-all duration-200"
        >
          <Star className="h-3.5 w-3.5 text-amber-500/80 shrink-0 fill-amber-500/10" />
          <span>{formatStars(meta.stars)} stars</span>
        </a>
      )}
    </div>
  );
}
