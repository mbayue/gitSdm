import type { RepoMeta, RepoAnalysis } from '@/types';
import { formatStars } from '@/lib/utils';
import { History, Star } from 'lucide-react';
import { getTotalCommits } from './getRepoStats';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderStatsProps {
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
}

export function HeaderStats({ analysis, meta: propsMeta }: HeaderStatsProps) {
  const meta = propsMeta ?? analysis?.meta;
  const totalCommits = getTotalCommits(analysis);

  return (
    <div className="hidden md:flex items-center gap-3 select-none shrink-0 text-xs text-muted-foreground font-medium">
      {totalCommits > 0 && (
        <Tooltip>
        <TooltipTrigger render={<span tabIndex={0} />} className="flex items-center gap-1">
          <History className="h-3 w-3 shrink-0" />
          <span>{totalCommits.toLocaleString()} total</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Total commits</TooltipContent>
        </Tooltip>
      )}

      {meta && (
        <Tooltip>
        <TooltipTrigger render={<a
          href={`https://github.com/${meta.fullName}`}
          target="_blank"
          rel="noopener noreferrer"
        />}
          className="flex items-center gap-1 hover:text-foreground transition-colors duration-200"
        >
          <Star className="h-3 w-3 shrink-0" />
          <span>{formatStars(meta.stars)}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">GitHub Stars</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
