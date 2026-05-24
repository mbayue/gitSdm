import type {
  AIArchitectureResponse,
  AIExplainRequest,
  AIExplainResponse,
  AIOnboardingResponse,
  AISuggestFilesResponse,
  RepoAnalysis,
  TrendingRepo,
} from '@/types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export async function analyzeRepo(url: string): Promise<RepoAnalysis> {
  return request<RepoAnalysis>('/api/repo/analyze', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function fetchRepoFile(
  owner: string,
  repo: string,
  path: string,
): Promise<{ path: string; content: string; sha: string }> {
  const params = new URLSearchParams({ owner, repo, path });
  return request<{ path: string; content: string; sha: string }>(
    `/api/repo/file?${params}`,
  );
}

export async function fetchTrending(): Promise<TrendingRepo[]> {
  const data = await request<{ repos: TrendingRepo[] }>('/api/trending');
  return data.repos;
}

export async function aiExplain(body: AIExplainRequest): Promise<AIExplainResponse> {
  return request<AIExplainResponse>('/api/ai/explain', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function aiArchitecture(
  owner: string,
  repo: string,
): Promise<AIArchitectureResponse> {
  return request<AIArchitectureResponse>('/api/ai/architecture', {
    method: 'POST',
    body: JSON.stringify({ owner, repo }),
  });
}

export async function aiSuggestFiles(
  owner: string,
  repo: string,
): Promise<AISuggestFilesResponse> {
  return request<AISuggestFilesResponse>('/api/ai/suggest-files', {
    method: 'POST',
    body: JSON.stringify({ owner, repo }),
  });
}

export async function aiOnboarding(
  owner: string,
  repo: string,
): Promise<AIOnboardingResponse> {
  return request<AIOnboardingResponse>('/api/ai/onboarding', {
    method: 'POST',
    body: JSON.stringify({ owner, repo }),
  });
}
