export interface AIExplainRequest {
  owner: string;
  repo: string;
  sha?: string;
  scope: 'repo' | 'node' | 'file';
  nodeId?: string;
  filePath?: string;
  fileSnippet?: string;
  context?: string;
  branch?: string;
  eli5?: boolean;
}

export interface AIExplainResponse {
  explanation: string;
  cached: boolean;
}

export interface AIArchitectureResponse {
  overview: string;
  layers: { name: string; description: string }[];
  cached: boolean;
}

export interface AISuggestFilesResponse {
  files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[];
  cached: boolean;
}

export interface AIOnboardingResponse {
  steps: { title: string; description: string; filePath?: string }[];
  cached: boolean;
}

export interface AIExplainLifResponse {
  explanation: string;
  cached: boolean;
}

export interface AIRefactorSuggestion {
  title: string;
  description: string;
  category: string;
  files: string[];
  risk: 'high' | 'medium' | 'low';
}

export interface AIRefactorResponse {
  suggestions: AIRefactorSuggestion[];
  cached: boolean;
}

export interface AIHealthResponse {
  scores: {
    maintainability: number;
    modularity: number;
    readability: number;
    architecture: number;
    complexity: number;
  };
  summary: string;
  cached: boolean;
}

export interface AIMermaidResponse {
  diagram: string;
  cached: boolean;
}

export interface AIRoastResponse {
  roast: string;
  cached: boolean;
}

export interface AIReadmeEnhanceResponse {
  readme: string;
  cached: boolean;
}

export interface AILearningPathResponse {
  recommendedPath: {
    path: string;
    importance: number;
    reason: string;
    role: string;
  }[];
  cached: boolean;
}

// ── Semantic Search Types ──────────────────────────────────────────────

export interface SearchResultCard {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  language: string;
  score: number;
}

export interface QAAnswer {
  answer: string;
  citations: { filePath: string; startLine: number; endLine: number }[];
}

export interface SearchResponse {
  results: {
    chunk: {
      filePath: string;
      startLine: number;
      endLine: number;
      chunkIndex: number;
      language: string;
      content: string;
      repoKey: string;
      commitSha: string;
    };
    score: number;
  }[];
  query: string;
  cached: boolean;
}

export interface QAResponse {
  answer: string;
  citations: { filePath: string; startLine: number; endLine: number }[];
  cached: boolean;
}

export type IndexingStatus =
  | { state: 'idle' }
  | { state: 'indexing'; progress: number; filesProcessed: number; totalFiles: number }
  | { state: 'complete'; chunkCount: number; timestamp: number }
  | { state: 'failed'; error: string; failedFiles: number };
