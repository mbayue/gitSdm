import { useEffect, useRef } from "react";
import type { Node, FitViewOptions, SetCenterOptions } from "@xyflow/react";

interface UseGraphCenteringProps {
  nodes: Node[];
  layoutType: string;
  isCalculatingLayout: boolean;
  selectedNodeId: string | null;
  focusedFilePath: string | null;
  fitView: (options?: FitViewOptions) => void;
  setCenter: (x: number, y: number, options?: SetCenterOptions) => void;
}

export function useGraphCentering({
  nodes,
  layoutType,
  isCalculatingLayout,
  selectedNodeId,
  focusedFilePath,
  fitView,
  setCenter,
}: UseGraphCenteringProps) {
  const lastFittedLayoutRef = useRef<string | null>(null);

  // Fit view once the new layout finishes calculating and renders
  useEffect(() => {
    if (isCalculatingLayout || !nodes || nodes.length === 0) return;

    if (lastFittedLayoutRef.current !== layoutType) {
      lastFittedLayoutRef.current = layoutType;
      
      const activeId = selectedNodeId || focusedFilePath || null;
      if (activeId) return;

      const timer = setTimeout(() => {
        fitView({ duration: 800, padding: 0.35 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layoutType, nodes, isCalculatingLayout, fitView, selectedNodeId, focusedFilePath]);

  const lastCenteredIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    const activeId =
      selectedNodeId || (focusedFilePath ? focusedFilePath : null);
    if (!activeId) {
      lastCenteredIdRef.current = null;
      return;
    }
    if (lastCenteredIdRef.current === activeId) return;

    const targetNode = nodes.find(
      (n) =>
        n.id === activeId ||
        n.id === `file:${focusedFilePath}` ||
        n.id === `folder:${focusedFilePath}` ||
        (n.data?.path && n.data.path === focusedFilePath)
    );
    if (targetNode) {
      lastCenteredIdRef.current = activeId;
      const width =
        typeof targetNode.measured?.width === "number"
          ? targetNode.measured.width
          : targetNode.width ?? 0;
      const height =
        typeof targetNode.measured?.height === "number"
          ? targetNode.measured.height
          : targetNode.height ?? 0;
      const timer = setTimeout(() => {
        setCenter(
          targetNode.position.x + width / 2,
          targetNode.position.y + height / 2,
          { zoom: 1.3, duration: 480 }
        );
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, focusedFilePath, nodes, setCenter]);
}
