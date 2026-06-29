import type { GraphNode } from '@/types';
import type { ForceGraphNode, ForceGraphLink } from './forceGraphConstants';

export function getForceNodeRadius(node: ForceGraphNode): number {
  return Math.max(3.5, Math.min(13, 3.8 + Math.sqrt(Math.max(0, node.degree)) * 1.45));
}

export function getForceLinkColor(
  link: ForceGraphLink,
  selectedId: string | null,
  blastRadiusActive: boolean,
  highlightedNodeIds: Set<string>,
  compareBranch: string | null,
): string {
  const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
  const targetId = typeof link.target === 'string' ? link.target : link.target.id;

  if (blastRadiusActive && highlightedNodeIds.size > 0) {
    if (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId)) {
      if (sourceId === selectedId || targetId === selectedId) return '#22d3ee';
      return '#06b6d4';
    }
    return 'rgba(255,255,255,0.04)';
  }

  if (compareBranch) {
    const src = typeof link.source === 'object' ? link.source : null;
    const tgt = typeof link.target === 'object' ? link.target : null;
    const srcStatus = src?.diffStatus;
    const tgtStatus = tgt?.diffStatus;

    if (srcStatus || tgtStatus) {
      if (srcStatus === 'deleted' || tgtStatus === 'deleted') return 'rgba(239,68,68,0.45)';
      if (srcStatus === 'added' || tgtStatus === 'added') return 'rgba(34,197,94,0.35)';
      if (srcStatus === 'modified' || tgtStatus === 'modified') return 'rgba(245,158,11,0.35)';
    }
  }

  const src = typeof link.source === 'object' ? link.source as ForceGraphNode : null;

  if (!selectedId) {
    const baseColor = src?.color || 'rgba(180,190,220,0.35)';
    return baseColor.startsWith('rgba') || baseColor.startsWith('#') ? baseColor : baseColor; // standard fallback
  }
  if (sourceId === selectedId || targetId === selectedId) {
    return src?.color || 'rgba(255,255,255,0.8)';
  }
  return 'rgba(255,255,255,0.06)';
}

export function computeBlastRadius(
  selectedId: string,
  edges: { source: string; target: string; type?: string }[],
  nodes: Pick<GraphNode, 'id' | 'type' | 'data'>[] = [],
): Set<string> {
  const affected = new Set<string>([selectedId]);
  const queue: string[] = [];
  const selectedNode = nodes.find((node) => node.id === selectedId);

  if (!selectedNode || selectedNode.type === 'file') {
    queue.push(selectedId);
  } else if (selectedNode.type === 'folder') {
    const folderPath = selectedNode.data.path;
    if (folderPath) {
      for (const node of nodes) {
        if (node.type === 'file' && node.data.path?.startsWith(`${folderPath}/`)) {
          affected.add(node.id);
          queue.push(node.id);
        }
      }
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const edge of edges) {
      if (edge.target === curr && edge.type === 'imports') {
        const dependentId = edge.source;
        if (!affected.has(dependentId)) {
          affected.add(dependentId);
          queue.push(dependentId);
        }
      }
    }
  }

  return affected;
}
