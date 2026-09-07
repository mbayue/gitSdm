import { computeBlastRadius } from './blastRadius';
import type { ForceGraphNode, ForceGraphLink } from './forceGraphConstants';
import type { SizeMode } from '@/stores/vizStore';
import { GRAPH_THEMES, type GraphTheme } from './graph-theme';

export function getForceNodeRadius(node: ForceGraphNode, sizeMode?: SizeMode): number {
  const base = Math.max(3.5, Math.min(13, 3.8 + Math.sqrt(Math.max(0, node.degree)) * 1.45));
  if (sizeMode === 'complexity' && node.complexityScore) {
    return Math.min(24, base + node.complexityScore * 12);
  }
  return base;
}

export function getForceLinkColor(
  link: ForceGraphLink,
  selectedId: string | null,
  blastRadiusActive: boolean,
  highlightedNodeIds: Set<string>,
  compareBranch: string | null,
  theme: GraphTheme = 'dark',
): string {
  const palette = GRAPH_THEMES[theme];
  const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
  const targetId = typeof link.target === 'string' ? link.target : link.target.id;

  if (blastRadiusActive && highlightedNodeIds.size > 0) {
    if (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId)) {
      if (sourceId === selectedId || targetId === selectedId) return '#22d3ee';
      return '#06b6d4';
    }
    return palette.blastMutedLink;
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
    const baseColor = src?.color || palette.defaultLink;
    return baseColor.startsWith('rgba') || baseColor.startsWith('#') ? baseColor : baseColor; // standard fallback
  }
  if (sourceId === selectedId || targetId === selectedId) {
    return src?.color || palette.activeLink;
  }
  return palette.mutedLink;
}
export { computeBlastRadius };
