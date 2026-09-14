export interface SearchCoverage {
  kind: 'complete' | 'previous' | 'partial';
  commitSha: string;
  indexedFiles: number;
  totalFiles: number;
}

export function coverageMessage(coverage: SearchCoverage): string {
  if (coverage.kind === 'previous')
    return `Showing results from the previous index (${coverage.commitSha.slice(0, 7)}).`;
  if (coverage.kind === 'partial')
    return `Partial results — ${coverage.indexedFiles} of ${coverage.totalFiles} files indexed.`;
  return 'Showing results from the complete index.';
}
