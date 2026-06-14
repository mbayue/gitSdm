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
      
      const activeId = selectedNodeId || (focusedFilePath ? `file:${focusedFilePath}` : null);
      if (activeId) return;

      const timer = setTimeout(() => {
        fitView({ duration: 450, padding: 0.35 });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [layoutType, nodes, isCalculatingLayout, fitView, selectedNodeId, focusedFilePath]);

  const lastCenteredIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    const activeId =
      selectedNodeId || (focusedFilePath ? `file:${focusedFilePath}` : null);
    if (!activeId) {
      lastCenteredIdRef.current = null;
      return;
    }
    if (lastCenteredIdRef.current === activeId) return;

    const targetNode = nodes.find(
      (n) =>
        n.id === activeId || (n.data?.path && n.data.path === focusedFilePath)
    );
    if (targetNode) {
      lastCenteredIdRef.current = activeId;
      const x =
        targetNode.position.x +
        (targetNode.measured?.width ?? targetNode.width ?? 120) / 2;
      const y =
        targetNode.position.y +
        (targetNode.measured?.height ?? targetNode.height ?? 36) / 2;
      const timer = setTimeout(() => {
        setCenter(x, y, { zoom: 1.3, duration: 300 });
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, focusedFilePath, nodes, setCenter]);
}
