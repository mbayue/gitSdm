import type {
  AIArchitectureResponse,
  AIExplainRequest,
  AIExplainResponse,
  AIOnboardingResponse,
  AISuggestFilesResponse,
  RepoAnalysis,
  TrendingRepo,
  AIExplainLifResponse,
  AIRefactorResponse,
  AIHealthResponse,
  AIMermaidResponse,
  AIRoastResponse,
  AIReadmeEnhanceResponse,
  AILearningPathResponse,
  SearchResponse,
  QAResponse,
  IndexingStatus,
} from '@/types';

function getApiKeyHeader(): Record<string, string> {
  try {
    const key = localStorage.getItem('gitsdm_gemini_api_key');
    return key ? { 'X-Gemini-API-Key': key } : {};
  } catch {
    return {};
  }
}

function getGitHubTokenHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem('gitsdm_github_pat');
    return token ? { 'X-GitHub-Token': token } : {};
  } catch {
    return {};
  }
}

export class ApiError extends Error {
  public code?: string;
  public status: number;
  public details?: unknown;
  public error?: string;

  constructor(message: string, status: number, data?: { code?: string; details?: unknown; context?: unknown; error?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (data && typeof data === 'object') {
      this.code = data.code;
      this.details = data.details || data.context;
      this.error = data.error;
    }
  }
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const isAiRoute = path.startsWith('/api/ai');
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(isAiRoute ? getApiKeyHeader() : {}),
        ...getGitHubTokenHeader(),
        ...options?.headers,
      },
    });

    const data = await parseBody(res);

    if (!res.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string'
          ? data.message
          : typeof data === 'object' &&
            data !== null &&
            'error' in data &&
            typeof data.error === 'string'
            ? data.error
            : typeof data === 'string'
            ? data
            : `Request failed with status ${res.status}`;

      throw new ApiError(message, res.status, typeof data === 'object' && data !== null ? data : undefined);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error or unexpected failure', 0);
  }
}


export async function analyzeRepo(url: string, branch?: string): Promise<RepoAnalysis> {
  return request<RepoAnalysis>('/api/repo/analyze', {
    method: 'POST',
    body: JSON.stringify({ url, branch }),
  });
}

export async function fetchRepoBranches(
  owner: string,
  repo: string,
): Promise<{ name: string; protected: boolean }[]> {
  const params = new URLSearchParams({ owner, repo });
  return request<{ name: string; protected: boolean }[]>(`/api/repo/branches?${params}`);
}

export async function fetchRepoFile(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<{ path: string; content: string; sha: string }> {
  const queryObj: Record<string, string> = { owner, repo, path };
  if (branch) queryObj.branch = branch;
  const params = new URLSearchParams(queryObj);
  return request<{ path: string; content: string; sha: string }>(
    `/api/repo/file?${params}`,
  );
}

export async function fetchTrending(): Promise<TrendingRepo[]> {
  const data = await request<{ repos: TrendingRepo[] }>('/api/trending');
  return data.repos;
}

export async function fetchAppConfig(): Promise<{ aiProvider: string }> {
  return request<{ aiProvider: string }>('/api/config');
}

export async function aiExplain(body: AIExplainRequest & { branch?: string }): Promise<AIExplainResponse> {
  return request<AIExplainResponse>('/api/ai/explain', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function aiArchitecture(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIArchitectureResponse> {
  return request<AIArchitectureResponse>('/api/ai/architecture', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiSuggestFiles(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AISuggestFilesResponse> {
  return request<AISuggestFilesResponse>('/api/ai/suggest-files', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiOnboarding(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIOnboardingResponse> {
  return request<AIOnboardingResponse>('/api/ai/onboarding', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiExplainLif(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIExplainLifResponse> {
  return request<AIExplainLifResponse>('/api/ai/explain-lif', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiRefactor(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIRefactorResponse> {
  return request<AIRefactorResponse>('/api/ai/refactor', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiHealth(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIHealthResponse> {
  return request<AIHealthResponse>('/api/ai/health', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiMermaid(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIMermaidResponse> {
  return request<AIMermaidResponse>('/api/ai/mermaid', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiRoast(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIRoastResponse> {
  return request<AIRoastResponse>('/api/ai/roast', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiReadmeEnhance(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIReadmeEnhanceResponse> {
  return request<AIReadmeEnhanceResponse>('/api/ai/readme-enhance', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function aiLearningPath(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AILearningPathResponse> {
  return request<AILearningPathResponse>('/api/ai/learning-path', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

// ── Semantic Search ────────────────────────────────────────────────────

export async function semanticSearch(
  query: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<SearchResponse> {
  return request<SearchResponse>('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, owner, repo, branch }),
  });
}

export async function semanticAsk(
  question: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<QAResponse> {
  return request<QAResponse>('/api/search/ask', {
    method: 'POST',
    body: JSON.stringify({ question, owner, repo, branch }),
  });
}

export async function triggerIndexing(
  owner: string,
  repo: string,
  branch?: string,
): Promise<{ status: string }> {
  return request<{ status: string }>('/api/search/index', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, branch }),
  });
}

export async function fetchIndexingStatus(
  owner: string,
  repo: string,
): Promise<IndexingStatus> {
  const params = new URLSearchParams({ owner, repo });
  return request<IndexingStatus>(`/api/search/status?${params}`);
}

