import { useEffect } from "react";
import { useVizStore } from "@/stores/vizStore";

export function useWorkspaceShortcuts() {
  const {
    closePanelsPreservingMode,
  } = useVizStore();

  // Responsive panel management
  useEffect(() => {
    let wasDesktop = window.innerWidth >= 1024;

    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile && wasDesktop) {
        closePanelsPreservingMode();
      } else if (!isMobile && !wasDesktop) {
        const state = useVizStore.getState();
        state.setWorkspaceMode(state.workspaceMode);
      }
      wasDesktop = !isMobile;
    };

    // Initial check on mount
    if (window.innerWidth < 1024) {
      closePanelsPreservingMode();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closePanelsPreservingMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable) ||
        e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented
      ) {
        return;
      }

      const state = useVizStore.getState();

      if (e.key === "[") {
        e.preventDefault();
        state.setExplorerOpen(!state.explorerOpen);
        if (!state.explorerOpen && window.innerWidth < 1024) state.setAiSidebarOpen(false);
      } else if (e.key === "]") {
        e.preventDefault();
        state.setAiSidebarOpen(!state.aiSidebarOpen);
        if (!state.aiSidebarOpen && window.innerWidth < 1024) state.setExplorerOpen(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (state.activeDropdown) {
          state.setActiveDropdown(null);
          return;
        }
        if (window.innerWidth < 1024 && (state.explorerOpen || state.aiSidebarOpen)) {
          state.closePanelsPreservingMode();
          return;
        }
        state.setSelectedNodeId(null);
        state.setFocusedFilePath(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
