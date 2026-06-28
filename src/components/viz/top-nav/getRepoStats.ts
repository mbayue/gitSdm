import type { RepoAnalysis } from '@/types';

export function getTotalCommits(analysis?: RepoAnalysis): number {
  return analysis?.totalCommits ?? analysis?.contributors?.reduce((sum, c) => sum + c.contributions, 0) ?? 0;
}
