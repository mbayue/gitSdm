import type { Node, Edge } from '@xyflow/react';

export const getBlastRadiusNodeIds = (
  selectedId: string,
  allNodes: Node[],
  allEdges: Edge[],
): Set<string> => {
  const affected = new Set<string>([selectedId]);
  const queue: string[] = [];
  const targetNode = allNodes.find((n) => n.id === selectedId);
  if (!targetNode) return affected;

  if (targetNode.type === "file") {
    queue.push(selectedId);
  } else if (targetNode.type === "folder") {
    const folderPath = targetNode.data?.path as string;
    if (folderPath) {
      for (const n of allNodes) {
        if (
          n.type === "file" &&
          n.data?.path &&
          (n.data.path as string).startsWith(folderPath + "/")
        ) {
          affected.add(n.id);
          queue.push(n.id);
        }
      }
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const edge of allEdges) {
      if (edge.target === curr && edge.type === "imports") {
        if (!affected.has(edge.source)) {
          affected.add(edge.source);
          queue.push(edge.source);
        }
      }
    }
  }
  return affected;
};
