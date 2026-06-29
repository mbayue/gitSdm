import type { GraphNode } from '@/types';

type BlastRadiusNode = Pick<GraphNode, 'id' | 'type' | 'data'>;
type BlastRadiusEdge = { source: string; target: string; type?: string };

export function getBlastRadiusSeedIds(
  selectedId: string,
  nodes: BlastRadiusNode[] = [],
): string[] {
  const selectedNode = nodes.find((node) => node.id === selectedId);

  if (!selectedNode || selectedNode.type === 'file') return [selectedId];
  if (selectedNode.type !== 'folder') return [];

  const folderPath = selectedNode.data.path;
  if (!folderPath) return [];

  const descendants = nodes
    .filter((node) => node.type === 'file' && node.data.path?.startsWith(`${folderPath}/`))
    .map((node) => node.id);

  return descendants;
}

export function computeBlastRadius(
  selectedId: string,
  edges: BlastRadiusEdge[],
  nodes: BlastRadiusNode[] = [],
): Set<string> {
  const affected = new Set<string>([selectedId]);
  const queue = getBlastRadiusSeedIds(selectedId, nodes);
  const dependentsByTarget = new Map<string, string[]>();

  for (const id of queue) {
    affected.add(id);
  }

  for (const edge of edges) {
    if (edge.type !== 'imports') continue;

    const dependents = dependentsByTarget.get(edge.target);
    if (dependents) {
      dependents.push(edge.source);
    } else {
      dependentsByTarget.set(edge.target, [edge.source]);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const dependentId of dependentsByTarget.get(curr) ?? []) {
      if (!affected.has(dependentId)) {
        affected.add(dependentId);
        queue.push(dependentId);
      }
    }
  }

  return affected;
}