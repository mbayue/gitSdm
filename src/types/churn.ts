export interface FileChurnData {
  commitCount: number;
  authorCount: number;
  lastModified?: string;
  churnScore: number;
}

export interface ChurnResponse {
  files: Record<string, FileChurnData>;
  checked: number;
  total: number;
  complete: boolean;
  issue?: 'rate-limit' | 'access' | 'timeout-or-network';
  retryAt?: number;
  remaining: string[];
  failures: Record<string, { issue: NonNullable<ChurnResponse['issue']>; retryAt: number }>;
  /** Opaque credential-scope fingerprint echoed back in the next continuation.
   *  Lets the server reject stale progress after a credential change. Never a secret. */
  scope?: string;
}

export interface ChurnContinuation {
  completed?: string[];
  pending?: string[];
  /** Scope echoed from a prior ChurnResponse; omitted by older clients (trusted for back-compat). */
  scope?: string;
}
