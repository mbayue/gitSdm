import type { RepoMeta, RepoAnalysis } from '@/types';
import { formatStars } from '@/lib/utils';
import { History, Star } from 'lucide-react';
import { getTotalCommits } from './getRepoStats';

interface HeaderStatsProps {
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
}

export function HeaderStats({ analysis, meta: propsMeta }: HeaderStatsProps) {
  const meta = propsMeta ?? analysis?.meta;
  const totalCommits = getTotalCommits(analysis);

  return (
    <div className="hidden md:flex items-center gap-3 select-none shrink-0 text-[10px] text-zinc-500 font-medium">
      {totalCommits > 0 && (
        <div className="flex items-center gap-1" title="Total commits">
          <History className="h-3 w-3 shrink-0" />
          <span>{totalCommits.toLocaleString()} total</span>
        </div>
      )}

      {meta && (
        <a
          href={`https://github.com/${meta.fullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-[#e6edf3] transition-colors duration-200"
          title="GitHub Stars"
        >
          <Star className="h-3 w-3 shrink-0" />
          <span>{formatStars(meta.stars)}</span>
        </a>
      )}
    </div>
  );
}
