import { useEffect } from "react";
import { useVizStore } from "@/stores/vizStore";

export function useWorkspaceShortcuts() {
  const { 
    workspaceMode, 
    setExplorerOpen, 
    setAiSidebarOpen, 
    setSidebarTab
  } = useVizStore();

  // Workspace mode effect
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setExplorerOpen(false);
      setAiSidebarOpen(false);
      return;
    }

    if (workspaceMode === 'focus') {
      setExplorerOpen(true);
      setAiSidebarOpen(false);
    } else if (workspaceMode === 'analysis') {
      setExplorerOpen(true);
      setAiSidebarOpen(true);
      setSidebarTab('analysis');
    } else if (workspaceMode === 'learning') {
      setExplorerOpen(true);
      setAiSidebarOpen(true);
      setSidebarTab('learning');
    } else if (workspaceMode === 'full') {
      setExplorerOpen(true);
      setAiSidebarOpen(true);
    }
  }, [workspaceMode, setExplorerOpen, setAiSidebarOpen, setSidebarTab]);

  // Responsive panel management
  useEffect(() => {
    let wasDesktop = window.innerWidth >= 1024;

    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile && wasDesktop) {
        setExplorerOpen(false);
        setAiSidebarOpen(false);
      }
      wasDesktop = !isMobile;
    };

    // Initial check on mount
    if (window.innerWidth < 1024) {
      setExplorerOpen(false);
      setAiSidebarOpen(false);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setExplorerOpen, setAiSidebarOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const state = useVizStore.getState();

      if (e.key === "[") {
        e.preventDefault();
        state.setExplorerOpen(!state.explorerOpen);
      } else if (e.key === "]") {
        e.preventDefault();
        state.setAiSidebarOpen(!state.aiSidebarOpen);
      } else if (e.key === "Escape") {
        e.preventDefault();
        state.setSelectedNodeId(null);
        state.setFocusedFilePath(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
