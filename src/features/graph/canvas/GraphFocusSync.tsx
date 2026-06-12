import { useEffect, useRef, useState } from 'react';
import { useReactFlow, getConnectedEdges } from '@xyflow/react';
import { useVizStore } from '@/stores/vizStore';

/** Pans/zooms the graph to the file node when a path is selected in the explorer. */
export function GraphFocusSync() {
  const focusedFilePath = useVizStore((s) => s.focusedFilePath);
  const setSelectedNodeId = useVizStore((s) => s.setSelectedNodeId);
  const setHighlightedNodeIds = useVizStore((s) => s.setHighlightedNodeIds);
  const { getNode, getEdges, setCenter } = useReactFlow();

  // Retry counter for when nodes haven't been laid out yet (e.g., navigating from SearchPage)
  const retryRef = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!focusedFilePath) {
      retryRef.current = 0;
      return;
    }

    const nodeId = `file:${focusedFilePath}`;
    const target = getNode(nodeId);

    // If node not found yet, retry up to 3 times with increasing delay
    // (nodes may not be laid out on first mount)
    if (!target) {
      if (retryRef.current < 3) {
        retryRef.current++;
        const timer = setTimeout(() => {
          setTick(t => t + 1);
        }, 200 * retryRef.current);
        return () => clearTimeout(timer);
      }
      return;
    }

    retryRef.current = 0;
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
      const width = typeof target.measured?.width === 'number' ? target.measured.width : target.width ?? 0;
      const height = typeof target.measured?.height === 'number' ? target.measured.height : target.height ?? 0;
      setCenter(target.position.x + width / 2, target.position.y + height / 2, {
        duration: 480,
        zoom: 1.3,
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [
    focusedFilePath,
    getNode,
    getEdges,
    setCenter,
    setSelectedNodeId,
    setHighlightedNodeIds,
    tick,
  ]);

  return null;
}
