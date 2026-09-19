import { useRepoChurn } from '@/hooks/useRepoChurn';

export function ChurnStatus({ owner, repo, sha }: { owner: string; repo: string; sha: string }) {
  const query = useRepoChurn(owner, repo, sha, true);
  const data = query.data;
  return (
    <div className="border-b border-border bg-card px-3 py-2 text-xs text-muted-foreground" role="status">
      {query.isError ? 'Failed to load churn history.' : data ? `Churn: ${data.checked} of ${data.total} sampled files checked.` : 'Loading churn history…'}
      {data?.issue &&
        ` ${data.issue === 'access' ? 'Check GitHub access.' : data.issue === 'rate-limit' ? 'Waiting for GitHub rate limit reset.' : 'Some files timed out; remaining files continue loading.'}`}
      {(query.isError || data?.issue) && (
        <button type="button" className="ml-2 text-accent underline" onClick={() => void query.refetch()}>
          Retry remaining files
        </button>
      )}
    </div>
  );
}
