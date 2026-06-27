import type { GraphNode, GraphEdge, NodeType } from '@/types';
import type { ForceGraphNode, ForceGraphLink } from './forceGraphConstants';
import { COMMUNITY_COLORS, NODE_TYPE_COLORS } from './forceGraphConstants';

interface BuildOptions {
  nodeTypeFilters: Set<NodeType>;
  fileTypeFilters: Set<string>;
}

export function buildForceGraphData(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: BuildOptions,
): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
  const { nodeTypeFilters, fileTypeFilters } = options;

  const visibleNodeIds = new Set(
    nodes
      .filter((node) => nodeTypeFilters.has(node.type))
      .filter((node) => {
        if (node.type !== 'file' || fileTypeFilters.size === 0) return true;
        const type = node.data.extension || node.data.fileClass || node.type;
        const label = String(type).startsWith('.') ? String(type) : `.${String(type)}`;
        return fileTypeFilters.has(label);
      })
      .map((node) => node.id),
  );

  const degreeById = new Map<string, number>();
  for (const edge of edges) {
    if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
    degreeById.set(edge.source, (degreeById.get(edge.source) ?? 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) ?? 0) + 1);
  }

  const communityIndexByKey = new Map<string, number>();
  const getCommunityColor = (key: string) => {
    if (!communityIndexByKey.has(key)) communityIndexByKey.set(key, communityIndexByKey.size);
    return COMMUNITY_COLORS[(communityIndexByKey.get(key) ?? 0) % COMMUNITY_COLORS.length];
  };

  const forceNodes: ForceGraphNode[] = nodes
    .filter((node) => visibleNodeIds.has(node.id))
    .map((node) => {
      const fileType = node.data.extension || node.data.fileClass || node.type;
      const community = String(node.data.fileClass || node.type);
      const communityName = community.charAt(0).toUpperCase() + community.slice(1);

      return {
        id: node.id,
        label: node.data.label,
        community,
        communityName,
        sourceFile: node.data.path,
        fileType,
        nodeType: node.type,
        degree: degreeById.get(node.id) ?? 0,
        color: node.data.nodeColor || NODE_TYPE_COLORS[node.type] || getCommunityColor(community),
        diffStatus: node.data.diffStatus,
      };
    });

  const forceLinks: ForceGraphLink[] = edges
    .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    .map((edge) => ({ source: edge.source, target: edge.target, type: edge.type }));

  return { nodes: forceNodes, links: forceLinks };
}
