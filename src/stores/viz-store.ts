import { create } from 'zustand';
import type { NodeType } from '@/types';

export type SidebarTab = 'start' | 'explain' | 'architecture' | 'health' | 'playground' | 'dependencies';
export type LayoutType = 'TB' | 'LR' | 'force';

interface VizState {
  searchQuery: string;
  nodeTypeFilters: Set<NodeType>;
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  sidebarTab: SidebarTab;
  drawerOpen: boolean;
  explorerOpen: boolean;
  aiSidebarOpen: boolean;
  inspectorOpen: boolean;
  focusedFilePath: string | null;
  onboardingStep: number;
  layoutType: LayoutType;
  toastMessage: string | null;
  theme: 'dark' | 'light';
  selectedBranch: string | null;
  compareBranch: string | null;
  availableBranches: string[];
  activeView: 'graph' | 'architecture' | 'contributors' | 'commits';

  // Interactive upgrades
  hoveredNodeId: string | null;
  hoveredConnectedIds: Set<string>;
  executionFlowActive: boolean;
  executionFlowStep: number;
  executionFlowPaths: string[];
  activeFocusLayer: 'all' | 'api' | 'ui' | 'core' | 'config';
  diffStatusFilters: Set<'added' | 'modified' | 'deleted'>;

  toggleDiffStatusFilter: (status: 'added' | 'modified' | 'deleted') => void;
  setSelectedBranch: (branch: string | null) => void;
  setCompareBranch: (branch: string | null) => void;
  setAvailableBranches: (branches: string[]) => void;
  setToastMessage: (msg: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleNodeTypeFilter: (type: NodeType) => void;
  setSelectedNodeId: (id: string | null) => void;
  setHighlightedNodeIds: (ids: Set<string>) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setDrawerOpen: (open: boolean) => void;
  setExplorerOpen: (open: boolean) => void;
  setAiSidebarOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setFocusedFilePath: (path: string | null) => void;
  setOnboardingStep: (step: number) => void;
  setLayoutType: (type: LayoutType) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  setHoveredNodeId: (id: string | null) => void;
  setHoveredConnectedIds: (ids: Set<string>) => void;
  setExecutionFlowActive: (active: boolean) => void;
  setExecutionFlowStep: (step: number) => void;
  setExecutionFlowPaths: (paths: string[]) => void;
  setActiveFocusLayer: (layer: 'all' | 'api' | 'ui' | 'core' | 'config') => void;
  setActiveView: (view: 'graph' | 'architecture' | 'contributors' | 'commits') => void;

  reset: () => void;
}

const defaultFilters = new Set<NodeType>(['repo', 'folder', 'file']);

export const useVizStore = create<VizState>((set) => ({
  searchQuery: '',
  nodeTypeFilters: new Set(defaultFilters),
  selectedNodeId: null,
  highlightedNodeIds: new Set(),
  sidebarTab: 'start',
  drawerOpen: false,
  explorerOpen: true,
  aiSidebarOpen: true,
  inspectorOpen: false,
  focusedFilePath: null,
  onboardingStep: 0,
  layoutType: 'force',
  toastMessage: null,
  theme: (typeof window !== 'undefined' ? (localStorage.getItem('theme') ?? 'dark') : 'dark') as 'dark' | 'light',
  selectedBranch: null,
  compareBranch: null,
  availableBranches: [],
  activeView: 'graph',

  hoveredNodeId: null,
  hoveredConnectedIds: new Set(),
  executionFlowActive: false,
  executionFlowStep: 0,
  executionFlowPaths: [],
  activeFocusLayer: 'all',
  diffStatusFilters: new Set(),

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
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setHighlightedNodeIds: (highlightedNodeIds) => set({ highlightedNodeIds }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setExplorerOpen: (explorerOpen) => set({ explorerOpen }),
  setAiSidebarOpen: (aiSidebarOpen) => set({ aiSidebarOpen }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setFocusedFilePath: (focusedFilePath) => set({ focusedFilePath }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  setLayoutType: (layoutType) => set({ layoutType }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const nextTheme = s.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') localStorage.setItem('theme', nextTheme);
      return { theme: nextTheme };
    }),

  setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
  setHoveredConnectedIds: (hoveredConnectedIds) => set({ hoveredConnectedIds }),
  setExecutionFlowActive: (executionFlowActive) => set({ executionFlowActive }),
  setExecutionFlowStep: (executionFlowStep) => set({ executionFlowStep }),
  setExecutionFlowPaths: (executionFlowPaths) => set({ executionFlowPaths }),
  setActiveFocusLayer: (activeFocusLayer) => set({ activeFocusLayer }),
  setActiveView: (activeView) => set({ activeView }),

  reset: () =>
    set({
      searchQuery: '',
      nodeTypeFilters: new Set(defaultFilters),
      selectedNodeId: null,
      highlightedNodeIds: new Set(),
      sidebarTab: 'start',
      drawerOpen: false,
      explorerOpen: true,
      aiSidebarOpen: true,
      inspectorOpen: false,
      focusedFilePath: null,
      onboardingStep: 0,
      layoutType: 'force',
      toastMessage: null,
      selectedBranch: null,
      compareBranch: null,
      hoveredNodeId: null,
      hoveredConnectedIds: new Set(),
      executionFlowActive: false,
      executionFlowStep: 0,
      executionFlowPaths: [],
      activeFocusLayer: 'all',
      diffStatusFilters: new Set(),
      activeView: 'graph',
    }),
}));

