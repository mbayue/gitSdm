import type { RepoAnalysis } from '@/types';

export function getTotalCommits(analysis?: RepoAnalysis): number {
  return (
    analysis?.timeline?.reduce((sum, w) => sum + w.count, 0) ??
    analysis?.contributors?.reduce((sum, c) => sum + c.contributions, 0) ??
    0
  );
}
