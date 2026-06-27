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
  layout: 'dagre';
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
  graph: GraphData;
  contributors: Contributor[];
  timeline: TimelineWeek[];
  importantFiles: string[];
  totalFiles?: number;
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
