import type {
  AIArchitectureResponse,
  AIExplainRequest,
  AIExplainResponse,
  AIOnboardingResponse,
  AISuggestFilesResponse,
  RepoAnalysis,
  TrendingRepo,
  AIExplainNewResponse,
  AIRefactorResponse,
  AIHealthResponse,
  AIMermaidResponse,
  AIRoastResponse,
  AIReadmeEnhanceResponse,
  AILearningPathResponse,
} from '@/types';

function getApiKeyHeader(): Record<string, string> {
  try {
    const key = localStorage.getItem('gitsdm_gemini_api_key');
    return key ? { 'X-Gemini-API-Key': key } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isAiRoute = path.startsWith('/api/ai');
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(isAiRoute ? getApiKeyHeader() : {}),
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
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

export async function aiExplainNew(
  owner: string,
  repo: string,
  branch?: string,
): Promise<AIExplainNewResponse> {
  return request<AIExplainNewResponse>('/api/ai/explain-new', {
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

