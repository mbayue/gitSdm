import type { IndexScope } from '@/lib/apiClient';
import type { IndexingStatus } from '@/types';

export interface SearchStateSnapshot {
  indexAction: 'index' | 'cancel' | null;
  indexingStatus: IndexingStatus;
}

// An index operation is active while its mutation is in flight or its status is
// mid-flight (indexing / paused-resumable). Resetting the store then would
// abandon the operation: its completion gets ignored and the controls could
// start a duplicate build while the original keeps running on the server.
export function shouldResetSearchState(state: SearchStateSnapshot): boolean {
  if (state.indexAction) return false;
  return state.indexingStatus.state !== 'indexing' && state.indexingStatus.state !== 'paused';
}

// Only mid-flight statuses carry the snapshot the index was built against;
// requests must target that snapshot, not a moved branch head.
export function resolveRunningSha(status: IndexingStatus): string | undefined {
  return status.state === 'indexing' || status.state === 'paused' ? status.snapshotSha : undefined;
}

// The running snapshot outranks the selected branch while an operation is active.
export function resolveRequestBranch(runningSha: string | undefined, branch: string | undefined): string | undefined {
  return runningSha ?? branch;
}

// A paused operation resumes its existing build; anything else starts a fresh one.
export function resolveBuildId(status: IndexingStatus, indexBuildId: string | undefined): string {
  if (status.state === 'paused' && indexBuildId) return indexBuildId;
  return crypto.randomUUID();
}

// A complete index or any reported coverage enables search (partial coverage included).
export function isSearchEnabled(status: IndexingStatus): boolean {
  return status.state === 'complete' || Boolean(status.coverage);
}

// An operation is active while its mutation is in flight or its status is mid-flight.
export function isOperationActive(indexAction: 'index' | 'cancel' | null, status: IndexingStatus): boolean {
  return indexAction !== null || status.state === 'indexing' || status.state === 'paused';
}

// While an operation is active, polling must target the scope it was started with;
// edited inputs only apply to requests and new builds after the operation settles.
export function resolvePollingScope(
  operationActive: boolean,
  operationScope: IndexScope | null,
  liveScope: IndexScope,
): IndexScope {
  return operationActive && operationScope ? operationScope : liveScope;
}

// An in-flight index operation belongs to the repo it was started for; navigating
// to another repo must abandon it instead of letting its completion overwrite the
// new repository's state.
export function shouldResetForRepoChange(
  owner: string,
  repo: string,
  state: { indexOwner: string | null; indexRepo: string | null; indexAction: 'index' | 'cancel' | null },
): boolean {
  if (state.indexOwner === null && state.indexRepo === null) return false;
  return state.indexOwner !== owner || state.indexRepo !== repo;
}
