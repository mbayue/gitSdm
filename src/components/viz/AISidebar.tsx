import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, FileText, Sparkles, PanelRightClose, PanelRightOpen, Info, GraduationCap, Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVizStore, type SidebarTab } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';

import { LearningPathTab } from './LearningPathTab';
import { OverviewTab } from './OverviewTab';
import { AnalysisTab } from './AnalysisTab';
import { AiCenterTab } from './ai-sidebar/AiCenterTab';
import { DependencyHealthTab } from './DependencyHealthTab';

// Subcomponents & Helpers
import { computeBlastRadius } from '@/features/graph/force/blastRadius';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const tabs = [
  { id: 'overview' as SidebarTab, label: 'Overview', icon: Info },
  { id: 'analysis' as SidebarTab, label: 'Detail', icon: FileText },
  { id: 'dependencies' as SidebarTab, label: 'Dependencies', icon: Network },
  { id: 'ai' as SidebarTab, label: 'Analysis', icon: Brain },
  { id: 'learning' as SidebarTab, label: 'Learning', icon: GraduationCap },
];

interface AISidebarProps {
  analysis: RepoAnalysis;
  style?: React.CSSProperties;
  graphDiff?: {
    added: Set<string>;
    modified: Set<string>;
    deleted: Set<string>;
  } | null;
}

// 1. SidebarHeader Component
interface SidebarHeaderProps {
  onClose: () => void;
}

function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between shrink-0 border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-4 py-3.5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#8b949e]" />
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#e6edf3] font-mono">
          Contextual Analysis
        </h2>
      </div>
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors outline-none cursor-pointer"
        >
          <PanelRightClose className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="left">Hide sidebar panel</TooltipContent>
      </Tooltip>
    </div>
  );
}

// 2. TabNavigation Component (Segmented tab bar)
interface TabNavigationProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
}

function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <div className="flex items-center w-full justify-between gap-1 bg-[#0d1117] rounded-md border border-[rgba(240,246,252,0.1)] p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center justify-center h-8 rounded-sm text-xs font-semibold transition-all duration-200 outline-none select-none cursor-pointer border border-transparent",
              isActive
                ? "flex-1 px-3 bg-[#161b22] text-[#e6edf3] border-[rgba(240,246,252,0.1)]"
                : "w-8 shrink-0 p-0 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.05)]"
            )}
            title={tab.label}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-[#e6edf3]" : "text-[#8b949e]")} />
            {isActive && <span className="ml-1.5 truncate text-[11px]">{tab.label}</span>}
          </button>
        );
      })}
    </div>
  );
}


export function AISidebar({
  analysis,
  style,
  graphDiff,
}: AISidebarProps) {
  const {
    sidebarTab,
    setSidebarTab,
    selectedNodeId,
    setSelectedNodeId,
    selectedBranch,
    aiSidebarOpen,
    setAiSidebarOpen,
    blastRadiusActive,
  } = useVizStore();

  const selectedNode = selectedNodeId
    ? analysis.graph.nodes.find((n) => n.id === selectedNodeId)
    : null;





  const blastRadiusIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return computeBlastRadius(selectedNode.id, analysis.graph.edges, analysis.graph.nodes);
  }, [selectedNode, analysis]);

  if (!aiSidebarOpen) {
    return (
      <div className="flex h-full w-10 shrink-0 flex-col items-center border-l border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-2 select-none">
        <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={() => setAiSidebarOpen(true)}
            className="rounded p-1.5 text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors outline-none cursor-pointer"
          >
            <PanelRightOpen className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent side="left">Show sidebar panel</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <aside
      style={style}
      className="flex h-full w-full shrink-0 flex-col border-l border-[rgba(240,246,252,0.1)] bg-[#161b22] relative select-none"
    >
      {/* 1. Header with spark icon & collapse triggers */}
      <SidebarHeader onClose={() => setAiSidebarOpen(false)} />

      {/* 2. Navigation Tabs Container */}
      <div className="bg-[#0d1117] shrink-0 border-b border-[rgba(240,246,252,0.1)] px-2">
        <TabNavigation activeTab={sidebarTab} setActiveTab={setSidebarTab} />
      </div>

      {/* 3. Main content body - The ONLY scroll container in the sidebar */}
      <div className="flex-1 overflow-y-auto p-4 text-sm scrollbar-thin">
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW */}
          {sidebarTab === 'overview' && (
            <TabPanel key="overview">
              <OverviewTab 
                analysis={analysis}
                selectedBranch={selectedBranch}
                graphDiff={graphDiff}
              />
            </TabPanel>
          )}

          {/* TAB 2: MAP */}
          {sidebarTab === 'analysis' && (
            <TabPanel key="analysis">
              <AnalysisTab 
                analysis={analysis}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                blastRadiusActive={blastRadiusActive}
                blastRadiusIds={blastRadiusIds}
              />
            </TabPanel>
          )}

          {sidebarTab === 'dependencies' && (
            <TabPanel key="dependencies">
              <DependencyHealthTab analysis={analysis} />
            </TabPanel>
          )}

          {sidebarTab === 'ai' && (
            <TabPanel key="ai">
              <AiCenterTab analysis={analysis} />
            </TabPanel>
          )}

          {sidebarTab === 'learning' && (
            <TabPanel key="learning">
              <LearningPathTab analysis={analysis} />
            </TabPanel>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Main content flows directly to the end of the sidebar */}
    </aside>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
