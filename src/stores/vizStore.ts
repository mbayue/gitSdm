import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NodeType } from "@/types";

export type SidebarTab = "overview" | "analysis" | "ai" | "learning";
export type LayoutType = "force" | "network";
export type WorkspaceMode = "focus" | "analysis" | "learning" | "full";

interface VizState {
  searchQuery: string;
  nodeTypeFilters: Set<NodeType>;
  fileTypeFilters: Set<string>;
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  sidebarTab: SidebarTab;
  workspaceMode: WorkspaceMode;
  explorerOpen: boolean;
  aiSidebarOpen: boolean;
  inspectorOpen: boolean;
  focusedFilePath: string | null;
  onboardingStep: number;
  layoutType: LayoutType;
  toastMessage: string | null;
  theme: "dark" | "light";
  selectedBranch: string | null;
  compareBranch: string | null;
  availableBranches: string[];
  activeView: "graph" | "architecture" | "contributors" | "commits";
  zoom: number;

  // Interactive upgrades
  hoveredNodeId: string | null;
  hoveredConnectedIds: Set<string>;
  executionFlowActive: boolean;
  executionFlowStep: number;
  executionFlowPaths: string[];
  activeFocusLayer: "all" | "api" | "ui" | "core" | "config";
  diffStatusFilters: Set<"added" | "modified" | "deleted">;
  blastRadiusActive: boolean;

  // Graph sidebar state
  graphSidebarOpen: boolean;
  graphSidebarSections: {
    nodeInfo: boolean;
    tools: boolean;
    nodeTypes: boolean;
    fileTypes: boolean;
    compare: boolean;
  };

  // Shared UI synchronization states
  activeDropdown: "filter" | "layout" | "export" | null;
  legendOpen: boolean;
  graphActionTrigger: {
    action: "zoomIn" | "zoomOut" | "fitView" | "reset" | "centerView";
    timestamp: number;
  } | null;

  toggleDiffStatusFilter: (status: "added" | "modified" | "deleted") => void;
  setSelectedBranch: (branch: string | null) => void;
  setCompareBranch: (branch: string | null) => void;
  setAvailableBranches: (branches: string[]) => void;
  setToastMessage: (msg: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleNodeTypeFilter: (type: NodeType) => void;
  toggleFileTypeFilter: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setHighlightedNodeIds: (ids: Set<string>) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setExplorerOpen: (open: boolean) => void;
  setAiSidebarOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setFocusedFilePath: (path: string | null) => void;
  setOnboardingStep: (step: number) => void;
  setLayoutType: (type: LayoutType) => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setZoom: (zoom: number) => void;

  setHoveredNodeId: (id: string | null) => void;
  setHoveredConnectedIds: (ids: Set<string>) => void;
  setExecutionFlowActive: (active: boolean) => void;
  setExecutionFlowStep: (step: number) => void;
  setExecutionFlowPaths: (paths: string[]) => void;
  setActiveFocusLayer: (
    layer: "all" | "api" | "ui" | "core" | "config",
  ) => void;
  setActiveView: (
    view: "graph" | "architecture" | "contributors" | "commits",
  ) => void;
  setBlastRadiusActive: (active: boolean) => void;
  setGraphSidebarOpen: (open: boolean) => void;
  toggleGraphSidebarSection: (
    key: keyof VizState["graphSidebarSections"],
  ) => void;
  resetFilters: () => void;

  setActiveDropdown: (dropdown: "filter" | "layout" | "export" | null) => void;
  setLegendOpen: (open: boolean) => void;
  triggerGraphAction: (action: "zoomIn" | "zoomOut" | "fitView" | "reset" | "centerView") => void;

  reset: () => void;
}

const defaultFilters = new Set<NodeType>(["repo", "folder", "file"]);

export const useVizStore = create<VizState>()(
  persist(
    (set) => ({
      searchQuery: "",
      nodeTypeFilters: new Set(defaultFilters),
      fileTypeFilters: new Set(),
      selectedNodeId: null,
      highlightedNodeIds: new Set(),
      sidebarTab: "overview",
      workspaceMode: "full",
      explorerOpen: true,
      aiSidebarOpen: true,
      inspectorOpen: false,
      focusedFilePath: null,
      onboardingStep: 0,
      layoutType: "force",
      zoom: 1.0,
      toastMessage: null,
      theme: "dark",
      selectedBranch: null,
      compareBranch: null,
      availableBranches: [],
      activeView: "graph",

  hoveredNodeId: null,
  hoveredConnectedIds: new Set(),
  executionFlowActive: false,
  executionFlowStep: 0,
  executionFlowPaths: [],
  activeFocusLayer: "all",
  diffStatusFilters: new Set(),
  blastRadiusActive: false,

  graphSidebarOpen: true,
  graphSidebarSections: {
    nodeInfo: true,
    tools: false,
    nodeTypes: true,
    fileTypes: false,
    compare: true,
  },

  activeDropdown: null,
  legendOpen: false,
  graphActionTrigger: null,

  toggleDiffStatusFilter: (status) =>
    set((s) => {
      const next = new Set(s.diffStatusFilters);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { diffStatusFilters: next };
    }),
  setSelectedBranch: (selectedBranch) => set({ selectedBranch }),
  setCompareBranch: (compareBranch) =>
    set((s) => ({
      compareBranch,
      diffStatusFilters: compareBranch ? s.diffStatusFilters : new Set(),
    })),
  setAvailableBranches: (availableBranches) => set({ availableBranches }),
  setToastMessage: (toastMessage) => set({ toastMessage }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleNodeTypeFilter: (type) =>
    set((s) => {
      const next = new Set(s.nodeTypeFilters);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { nodeTypeFilters: next };
    }),
  toggleFileTypeFilter: (type) =>
    set((s) => {
      const next = new Set(s.fileTypeFilters);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { fileTypeFilters: next };
    }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setHighlightedNodeIds: (highlightedNodeIds) => set({ highlightedNodeIds }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
  setExplorerOpen: (explorerOpen) => set({ explorerOpen }),
  setAiSidebarOpen: (aiSidebarOpen) => set({ aiSidebarOpen }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setFocusedFilePath: (focusedFilePath) => set({ focusedFilePath }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  setLayoutType: (layoutType) => set({ layoutType }),
  setZoom: (zoom) => set({ zoom }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") localStorage.setItem("theme", theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const nextTheme = s.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined")
         localStorage.setItem("theme", nextTheme);
      return { theme: nextTheme };
    }),

  setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
  setHoveredConnectedIds: (hoveredConnectedIds) => set({ hoveredConnectedIds }),
  setExecutionFlowActive: (executionFlowActive) => set({ executionFlowActive }),
  setExecutionFlowStep: (executionFlowStep) => set({ executionFlowStep }),
  setExecutionFlowPaths: (executionFlowPaths) => set({ executionFlowPaths }),
  setActiveFocusLayer: (activeFocusLayer) => set({ activeFocusLayer }),
  setActiveView: (activeView) => set({ activeView }),
  setBlastRadiusActive: (blastRadiusActive) => set({ blastRadiusActive }),
  setGraphSidebarOpen: (graphSidebarOpen) => set({ graphSidebarOpen }),
  toggleGraphSidebarSection: (key) =>
    set((s) => ({
      graphSidebarSections: {
        ...s.graphSidebarSections,
        [key]: !s.graphSidebarSections[key],
      },
    })),

  resetFilters: () =>
    set({
      nodeTypeFilters: new Set(defaultFilters),
      fileTypeFilters: new Set(),
      diffStatusFilters: new Set(),
      activeFocusLayer: "all",
      searchQuery: "",
    }),

  setActiveDropdown: (activeDropdown) => set({ activeDropdown }),
  setLegendOpen: (legendOpen) => set({ legendOpen }),
  triggerGraphAction: (action) => set({ graphActionTrigger: { action, timestamp: Date.now() } }),

  reset: () =>
    set({
      searchQuery: "",
      nodeTypeFilters: new Set(defaultFilters),
      fileTypeFilters: new Set(),
      selectedNodeId: null,
      highlightedNodeIds: new Set(),
      sidebarTab: "overview",
      workspaceMode: "full",
      explorerOpen: true,
      aiSidebarOpen: true,
      inspectorOpen: false,
      focusedFilePath: null,
       onboardingStep: 0,
      layoutType: "force",
      zoom: 1.0,
      toastMessage: null,
      selectedBranch: null,
      compareBranch: null,
      hoveredNodeId: null,
      hoveredConnectedIds: new Set(),
      executionFlowActive: false,
      executionFlowStep: 0,
      executionFlowPaths: [],
      activeFocusLayer: "all",
      diffStatusFilters: new Set(),
      activeView: "graph",
      blastRadiusActive: false,
      activeDropdown: null,
      legendOpen: false,
      graphActionTrigger: null,
    }),
  }),
  {
    name: 'gitsdm-viz-storage',
    partialize: (state) => ({
      workspaceMode: state.workspaceMode,
      explorerOpen: state.explorerOpen,
      aiSidebarOpen: state.aiSidebarOpen,
      inspectorOpen: state.inspectorOpen,
      sidebarTab: state.sidebarTab,
      layoutType: state.layoutType,
      theme: state.theme,
      activeView: state.activeView,
      graphSidebarOpen: state.graphSidebarOpen,
      activeDropdown: state.activeDropdown,
      legendOpen: state.legendOpen,
    }),
  }
));
