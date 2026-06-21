import { useEffect, useRef } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { ForceGraphNode, ForceGraphLink } from '../../force/forceGraphConstants';

interface ForceSyncProps {
  layoutType: string;
  selectedNodeId: string | null;
  focusedFilePath: string | null;
  nodes: ForceGraphNode[];
  graphActionTrigger: { action: string } | null;
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

  // Removed automatic centering on selectedNodeId change to align with requirements.

  useEffect(() => {
    if (layoutType !== "force") return;
    if (!graphActionTrigger) return;
    const { action } = graphActionTrigger;
    const ref = forceGraphRef.current;
    if (!ref) return;

    if (action === 'focusGraph') {
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
        : null;

      if (targetNode && typeof targetNode.x === "number" && typeof targetNode.y === "number") {
        ref.centerAt(targetNode.x, targetNode.y, 400);
        ref.zoom(3.2, 400);
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
