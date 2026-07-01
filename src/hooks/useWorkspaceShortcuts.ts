import { useEffect } from "react";
import { useVizStore, WorkspaceMode, SidebarTab } from "@/stores/vizStore";

const applyWorkspaceModeLayout = (
  mode: WorkspaceMode,
  setExplorerOpen: (open: boolean) => void,
  setAiSidebarOpen: (open: boolean) => void,
  setSidebarTab: (tab: SidebarTab) => void
) => {
  if (mode === 'focus') {
    setExplorerOpen(true);
    setAiSidebarOpen(false);
  } else if (mode === 'analysis') {
    setExplorerOpen(true);
    setAiSidebarOpen(true);
    setSidebarTab('analysis');
  } else if (mode === 'learning') {
    setExplorerOpen(true);
    setAiSidebarOpen(true);
    setSidebarTab('learning');
  } else if (mode === 'full') {
    setExplorerOpen(true);
    setAiSidebarOpen(true);
  }
};

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

    applyWorkspaceModeLayout(workspaceMode, setExplorerOpen, setAiSidebarOpen, setSidebarTab);
  }, [workspaceMode, setExplorerOpen, setAiSidebarOpen, setSidebarTab]);

  // Responsive panel management
  useEffect(() => {
    let wasDesktop = window.innerWidth >= 1024;

    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile && wasDesktop) {
        setExplorerOpen(false);
        setAiSidebarOpen(false);
      } else if (!isMobile && !wasDesktop) {
        const state = useVizStore.getState();
        applyWorkspaceModeLayout(state.workspaceMode, setExplorerOpen, setAiSidebarOpen, setSidebarTab);
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
  }, [setExplorerOpen, setAiSidebarOpen, setSidebarTab]);

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
