import type { IndexScope } from '@/lib/apiClient';

// Canonical scope identity for guarding stale async responses: JSON with
// include/exclude paths sorted, so equal scopes produce equal keys
// regardless of input order.
export function scopeKey(scope: IndexScope): string {
  return JSON.stringify({
    include: [...scope.includePaths].sort(),
    exclude: [...scope.excludePaths].sort(),
  });
}
