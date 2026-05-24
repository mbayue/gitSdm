import { useEffect } from 'react';
import { useReactFlow, getConnectedEdges } from '@xyflow/react';
import { useVizStore } from '@/stores/viz-store';

/** Pans/zooms the graph to the file node when a path is selected in the explorer. */
export function GraphFocusSync() {
  const focusedFilePath = useVizStore((s) => s.focusedFilePath);
  const setSelectedNodeId = useVizStore((s) => s.setSelectedNodeId);
  const setHighlightedNodeIds = useVizStore((s) => s.setHighlightedNodeIds);
  const { fitView, getNode, getEdges } = useReactFlow();

  useEffect(() => {
    if (!focusedFilePath) return;

    const nodeId = `file:${focusedFilePath}`;
    let target = getNode(nodeId);

    if (!target) {
      const parts = focusedFilePath.split('/');
      for (let i = parts.length - 1; i >= 0; i--) {
        const folderPath = parts.slice(0, i).join('/');
        const folderId = folderPath ? `folder:${folderPath}` : null;
        if (folderId && getNode(folderId)) {
          target = getNode(folderId)!;
          break;
        }
      }
    }

    if (!target) return;

    const id = target.id;
    setSelectedNodeId(id);

    const connected = getConnectedEdges([target], getEdges());
    const ids = new Set<string>([id]);
    connected.forEach((e) => {
      ids.add(e.source);
      ids.add(e.target);
    });
    setHighlightedNodeIds(ids);

    const timer = window.setTimeout(() => {
      fitView({
        nodes: [target],
        duration: 480,
        padding: 0.65,
        maxZoom: 1.35,
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [
    focusedFilePath,
    fitView,
    getNode,
    getEdges,
    setSelectedNodeId,
    setHighlightedNodeIds,
  ]);

  return null;
}
