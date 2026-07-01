import type { NodeType } from '@/types';
import type { LinkObject, NodeObject } from 'react-force-graph-2d';

export interface ForceGraphNode extends NodeObject {
  id: string;
  label: string;
  community: string;
  communityName: string;
  sourceFile?: string;
  fileType: string;
  nodeType: NodeType;
  degree: number;
  color: string;
  diffStatus?: 'added' | 'modified' | 'deleted';
  hasOutdatedDeps?: boolean;
}

export interface ForceGraphLink extends LinkObject<ForceGraphNode> {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  type?: string;
}

export const COMMUNITY_COLORS = [
  '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#6366f1',
];

export const NODE_TYPE_COLORS: Record<string, string> = {
  repo: '#8b5cf6',
  package: '#ec4899',
  folder: '#f59e0b',
  file: '#3b82f6',
};

export const DIFF_STATUS_COLORS: Record<string, string> = {
  added: '#22c55e',
  modified: '#f59e0b',
  deleted: '#ef4444',
};
