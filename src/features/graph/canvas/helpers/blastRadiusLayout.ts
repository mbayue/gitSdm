import type { Edge, Node } from '@xyflow/react';
import type { NodeType } from '@/types';
import { computeBlastRadius } from '../../force/forceGraphUtils';

const toGraphNodeType = (type: string | undefined): NodeType =>
  type === 'repo' || type === 'folder' || type === 'file' || type === 'package' || type === 'contributor'
    ? type
    : 'file';

export const getBlastRadiusNodeIds = (
  selectedId: string,
  allNodes: Node[],
  allEdges: Edge[],
): Set<string> => computeBlastRadius(
  selectedId,
  allEdges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    type: typeof edge.type === 'string' ? edge.type : undefined,
  })),
  allNodes.map((node) => ({
    id: node.id,
    type: toGraphNodeType(node.type),
    data: {
      label: typeof node.data?.label === 'string' ? node.data.label : node.id,
      path: typeof node.data?.path === 'string' ? node.data.path : undefined,
    },
  })),
);
