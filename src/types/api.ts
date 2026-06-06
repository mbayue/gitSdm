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

export interface AIExplainNewResponse {
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
  mentalModel: {
    type: string;
    concept: string;
    description: string;
  };
  recommendedPath: {
    path: string;
    importance: number;
    reason: string;
    role: string;
  }[];
  executionFlow: {
    steps: {
      from: string;
      to: string;
      description: string;
    }[];
    visualSteps: string[];
  };
  insights: {
    architecture: string;
    risks: string[];
    suggestions: string[];
  };
  cached: boolean;
}
