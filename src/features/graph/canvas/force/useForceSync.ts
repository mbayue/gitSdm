import { useEffect, useRef } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { ForceGraphNode, ForceGraphLink } from '../../force/forceGraphConstants';

type GraphAction = "zoomIn" | "zoomOut" | "fitView" | "reset" | "focusGraph";

interface ForceSyncProps {
  layoutType: string;
  selectedNodeId: string | null;
  focusedFilePath: string | null;
  nodes: ForceGraphNode[];
  graphActionTrigger: { action: GraphAction; timestamp: number } | null;
  forceGraphRef: React.MutableRefObject<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>;
  forceInitialViewDoneRef: React.MutableRefObject<boolean>;
}

export function useForceSync({
  layoutType,
  selectedNodeId,
  focusedFilePath,
  nodes,
  graphActionTrigger,
  forceGraphRef,
  forceInitialViewDoneRef,
}: ForceSyncProps) {
  const prevFocusRef = useRef<string | null>(null);
  const lastActionTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (layoutType !== "force") return;

    const targetId = selectedNodeId || focusedFilePath;
    if (!targetId) {
      prevFocusRef.current = null;
      return;
    }
    if (prevFocusRef.current === targetId) return;

    let attempts = 0;
    let timer: number | undefined;

    const focusTarget = () => {
      const ref = forceGraphRef.current;
      if (!ref) {
        attempts++;
        if (attempts < 20) timer = window.setTimeout(focusTarget, 150);
        return;
      }

      const node = nodes.find(
        (n) =>
          n.id === targetId ||
          (focusedFilePath &&
            (n.id === `file:${focusedFilePath}` ||
              n.id === `folder:${focusedFilePath}` ||
              n.sourceFile === focusedFilePath)),
      );

      if (node && typeof node.x === "number" && typeof node.y === "number") {
        forceInitialViewDoneRef.current = true;
        ref.centerAt(node.x, node.y, 300);
        ref.zoom(3.2, 300);
        prevFocusRef.current = targetId;
        return;
      }

      attempts++;
      if (attempts < 20) timer = window.setTimeout(focusTarget, 150);
    };

    timer = window.setTimeout(focusTarget, 10);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [
    layoutType,
    selectedNodeId,
    focusedFilePath,
    nodes,
    forceGraphRef,
    forceInitialViewDoneRef,
  ]);

  useEffect(() => {
    if (layoutType !== "force") return;
    if (!graphActionTrigger) return;
    if (lastActionTimestampRef.current === graphActionTrigger.timestamp) return;
    const { action } = graphActionTrigger;
    const ref = forceGraphRef.current;
    if (!ref) return;
    lastActionTimestampRef.current = graphActionTrigger.timestamp;

    if (action === 'zoomIn') {
      const currentZoom = ref.zoom();
      if (typeof currentZoom === 'number') ref.zoom(currentZoom * 1.3, 300);
    } else if (action === 'zoomOut') {
      const currentZoom = ref.zoom();
      if (typeof currentZoom === 'number') ref.zoom(currentZoom * 0.7, 300);
    } else if (action === 'fitView') {
      ref.zoomToFit(400, 60);
    } else if (action === 'reset') {
      ref.centerAt(0, 0, 400);
      ref.zoom(1.5, 400);
      prevFocusRef.current = null;
    } else if (action === 'focusGraph') {
      const activeId =
        selectedNodeId || (focusedFilePath ? focusedFilePath : null);
      const targetNode = activeId
        ? nodes.find(
            (n) =>
              n.id === activeId ||
              n.id === `file:${focusedFilePath}` ||
              n.id === `folder:${focusedFilePath}` ||
              (focusedFilePath &&
                (n.sourceFile === focusedFilePath)),
          )
        : nodes.find((n) => n.nodeType === 'repo');

      if (targetNode && typeof targetNode.x === "number" && typeof targetNode.y === "number") {
        ref.centerAt(targetNode.x, targetNode.y, 400);
        ref.zoom(activeId ? 3.2 : 1.5, 400);
      } else {
        ref.centerAt(0, 0, 400);
        ref.zoom(1.5, 400);
      }
    }
  }, [
    graphActionTrigger,
    layoutType,
    forceGraphRef,
    selectedNodeId,
    focusedFilePath,
    nodes,
  ]);

  return { prevFocusRef };
}
export default useForceSync;
