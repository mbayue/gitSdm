import type { RepoAnalysis } from '@/types';

export const getBlastRadiusIds = (nodeId: string, analysis: RepoAnalysis) => {
  const visited = new Set<string>();
  const startNodes = [nodeId];

  // If it's a folder, start from all children inside it
  const targetNode = analysis.graph.nodes.find(n => n.id === nodeId);
  if (targetNode?.type === 'folder' && targetNode.data.path) {
    const folderPath = targetNode.data.path;
    analysis.graph.nodes.forEach(n => {
      if (n.data.path?.startsWith(folderPath + '/')) {
        startNodes.push(n.id);
      }
    });
  }

  const queue = [...startNodes];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);

    // Sync with GraphCanvas: only follow 'imports' type edges
    analysis.graph.edges
      .filter(e => e.target === curr && e.type === 'imports')
      .forEach(e => queue.push(e.source));
  }
  return visited;
};
