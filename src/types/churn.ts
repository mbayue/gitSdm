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
}

export interface ChurnContinuation {
  completed?: string[];
  pending?: string[];
}
