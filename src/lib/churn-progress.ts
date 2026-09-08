import type { ChurnResponse } from '@/types/churn';

export function mergeChurn(previous: ChurnResponse | undefined, batch: ChurnResponse): ChurnResponse {
  const files = { ...previous?.files, ...batch.files };
  const max = Math.max(1, ...Object.values(files).map((file) => file.commitCount));
  for (const [path, file] of Object.entries(files)) files[path] = { ...file, churnScore: file.commitCount / max };
  const remaining = batch.remaining.filter((path) => !files[path]);
  const failures = { ...previous?.failures, ...batch.failures };
  for (const path of Object.keys(failures)) if (!remaining.includes(path)) delete failures[path];
  const issue = Object.values(failures).sort((a, b) => b.retryAt - a.retryAt)[0];
  return {
    ...batch,
    files,
    remaining,
    failures,
    checked: Object.keys(files).length,
    complete: remaining.length === 0,
    issue: issue?.issue,
    retryAt: issue?.retryAt,
  };
}

export function pendingChurn(data: ChurnResponse, now = Date.now()): string[] {
  if (data.issue === 'rate-limit' && (data.retryAt ?? 0) > now) return [];
  return data.remaining
    .filter((path) => !data.failures[path] || data.failures[path].retryAt <= now)
    .sort((a, b) => Number(!!data.failures[a]) - Number(!!data.failures[b]));
}

export function churnInterval(data: ChurnResponse | undefined, now = Date.now()): number | false {
  if (!data || data.complete || data.issue === 'access') return false;
  if (pendingChurn(data, now).length) return 1500;
  return Math.max(1500, (data.retryAt ?? now) - now);
}
