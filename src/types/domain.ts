export type NodeType = 'repo' | 'folder' | 'file' | 'package' | 'contributor';
export type EdgeType = 'contains' | 'depends_on' | 'imports';

export interface GraphNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    path?: string;
    extension?: string;
    ecosystem?: string;
    version?: string;
    avatarUrl?: string;
    commits?: number;
    fileClass?: FileClass;
    size?: number;
    childCount?: number;
    nodeColor?: string;
    circleSize?: number;
    diffStatus?: 'added' | 'modified' | 'deleted';
    isGenerated?: boolean;
    hasOutdatedDeps?: boolean;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: EdgeType;
  animated?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: 'dagre' | 'force';
}

export type FileClass = 'entry' | 'config' | 'test' | 'source' | 'doc' | 'asset' | 'other';

export interface TreeNode {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size?: number;
  sha?: string;
  children?: TreeNode[];
  fileClass?: FileClass;
}

export interface Dependency {
  name: string;
  version?: string;
  type: 'prod' | 'dev' | 'peer';
  ecosystem: string;
}

export type WorkspaceManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export type WorkspaceEcosystem = 'javascript';

export type WorkspaceManifest = {
  readonly ecosystem: WorkspaceEcosystem;
  readonly manager: WorkspaceManager;
  readonly manifestPath: string;
  readonly packageGlobs: readonly string[];
};

export type ScopedDependency = Dependency & {
  readonly manifestPath: string;
  readonly packageName?: string;
};

export type DependencyHealthState = 'current' | 'outdated' | 'unknown' | 'error' | 'unsupported';

export type DependencyHealthMetadata = {
  readonly status?: 'current' | 'outdated' | 'unknown' | 'error';
  readonly currentVersion?: string;
  readonly latestVersion?: string;
  readonly license?: string;
  readonly checkedAt?: string;
  readonly error?: string;
};

export type DependencyHealthEcosystemSupport = {
  readonly npm: 'freshness';
  readonly python: 'inventory-only';
  readonly go: 'inventory-only';
  readonly java: 'inventory-only';
  readonly rust: 'inventory-only';
  readonly docker: 'inventory-only';
};

export type DependencyHealthItem = {
  readonly ecosystem: string;
  readonly name: string;
  readonly type: Dependency['type'];
  readonly state: DependencyHealthState;
  readonly manifestPaths: readonly string[];
  readonly packageNames: readonly string[];
  readonly currentVersion?: string;
  readonly latestVersion?: string;
  readonly license?: string;
  readonly checkedAt?: string;
  readonly error?: string;
};

export type DependencyHealthSummary = {
  readonly total: number;
  readonly current: number;
  readonly outdated: number;
  readonly unknown: number;
  readonly errors: number;
  readonly unsupported: number;
};

export type DependencyHealthReport = {
  readonly generatedAt: string;
  readonly cacheTtlMs: number;
  readonly ecosystemSupport: DependencyHealthEcosystemSupport;
  readonly items: readonly DependencyHealthItem[];
  readonly summary: DependencyHealthSummary;
};

export type WorkspacePackage = {
  readonly ecosystem: WorkspaceEcosystem;
  readonly manager: WorkspaceManager;
  readonly rootPath: string;
  readonly manifestPath: string;
  readonly name?: string;
};

export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface TimelineWeek {
  week: string;
  count: number;
  commits: {
    sha: string;
    message: string;
    date: string;
    authorName?: string;
    authorLogin?: string;
    authorAvatar?: string;
  }[];
}

export interface RepoMeta {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  defaultBranch: string;
  sha: string;
  url: string;
  topics: string[];
  license: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepoAnalysis {
  meta: RepoMeta;
  tree: TreeNode[];
  treeTruncated: boolean;
  dependencies: Dependency[];
  workspacePackages?: WorkspacePackage[];
  dependencyHealth?: DependencyHealthReport;
  graph: GraphData;
  contributors: Contributor[];
  timeline: TimelineWeek[];
  importantFiles: string[];
  totalFiles?: number;
  totalCommits?: number;
}

export interface TrendingRepo {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  url: string;
}
