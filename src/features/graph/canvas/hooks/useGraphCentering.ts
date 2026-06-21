import { useEffect, useRef } from "react";
import type { Node, FitViewOptions } from "@xyflow/react";

interface UseGraphCenteringProps {
  nodes: Node[];
  layoutType: string;
  isCalculatingLayout: boolean;
  selectedNodeId: string | null;
  focusedFilePath: string | null;
  fitView: (options?: FitViewOptions) => void;
}

export function useGraphCentering({
  nodes,
  layoutType,
  isCalculatingLayout,
  selectedNodeId,
  focusedFilePath,
  fitView,
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
}
