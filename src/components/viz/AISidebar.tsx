import { TooltipHint } from '@/components/ui/tooltip';
import { useMemo } from 'react';
import {
  Brain, FileText, Sparkles, Info, GraduationCap, Network, PanelRightClose
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useVizStore, type SidebarTab } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';

import { LearningPathTab } from './LearningPathTab';
import { OverviewTab } from './OverviewTab';
import { AnalysisTab } from './AnalysisTab';
import { AiCenterTab } from './ai-sidebar/AiCenterTab';
import { DependencyHealthTab } from './DependencyHealthTab';

// Subcomponents & Helpers
import { computeBlastRadius } from '@/features/graph/force/blastRadius';

const tabs = [
  { id: 'overview' as SidebarTab, label: 'Overview', icon: Info },
  { id: 'analysis' as SidebarTab, label: 'Details', icon: FileText },
  { id: 'dependencies' as SidebarTab, label: 'Health', icon: Network },
  { id: 'ai' as SidebarTab, label: 'AI tools', icon: Brain },
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
function SidebarHeader() {
  const setAiSidebarOpen = useVizStore((s) => s.setAiSidebarOpen);
  return (
    <div className="flex h-12 items-center justify-between gap-2 shrink-0 border-b border-border px-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Repository insights
        </h2>
      </div>
      <TooltipHint content="Collapse repository insights" side="bottom">
        <button type="button" aria-label="Collapse repository insights"
          onClick={() => setAiSidebarOpen(false)} className="icon-button header-action">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </TooltipHint>
    </div>
  );
}

function TabNavigation() {
  return (
    <TabsList aria-label="Repository insights" className="flex h-auto w-full min-w-0 flex-wrap gap-0.5 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.id} value={tab.id}
          className="h-9 min-w-[30%] flex-1 gap-1 rounded-md px-1.5 text-xs whitespace-nowrap data-active:bg-secondary data-active:text-accent dark:data-active:bg-secondary dark:data-active:text-accent [&_svg]:shrink-0">
          <tab.icon className="size-3.5" />
          <span className="truncate">{tab.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
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
    blastRadiusActive,
  } = useVizStore();

  const nodeById = useMemo(
    () => new Map(analysis.graph.nodes.map((n) => [n.id, n])),
    [analysis.graph.nodes]
  );

  const selectedNode = selectedNodeId
    ? nodeById.get(selectedNodeId) ?? null
    : null;

  const blastRadiusIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return computeBlastRadius(selectedNode.id, analysis.graph.edges, analysis.graph.nodes);
  }, [selectedNode, analysis]);

  if (!aiSidebarOpen) return null;

  return (
    <aside
      style={style}
      className="flex h-full w-full shrink-0 flex-col border-l border-border bg-card relative"
    >
      <Tabs value={sidebarTab} onValueChange={(value) => {
        const tab = tabs.find((item) => item.id === value);
        if (tab) setSidebarTab(tab.id);
      }} className="h-full min-h-0 w-full min-w-0 flex-col gap-0">
      {/* 1. Header with spark icon */}
      <SidebarHeader />

      {/* 2. Navigation Tabs Container */}
      <div className="shrink-0 border-b border-border p-2">
        <TabNavigation />
      </div>

      {/* 3. Main content body - The ONLY scroll container in the sidebar */}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 text-sm scrollbar-thin">

          {/* TAB 1: OVERVIEW */}
          {sidebarTab === 'overview' && (
            <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-150">
              <OverviewTab 
                analysis={analysis}
                selectedBranch={selectedBranch}
                graphDiff={graphDiff}
              />
            </TabsContent>
          )}

          {/* TAB 2: MAP */}
          {sidebarTab === 'analysis' && (
            <TabsContent value="analysis" className="space-y-6 animate-in fade-in duration-150">
              <AnalysisTab 
                analysis={analysis}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                blastRadiusActive={blastRadiusActive}
                blastRadiusIds={blastRadiusIds}
              />
            </TabsContent>
          )}

          {sidebarTab === 'dependencies' && (
            <TabsContent value="dependencies" className="space-y-6 animate-in fade-in duration-150">
              <DependencyHealthTab analysis={analysis} />
            </TabsContent>
          )}

          {sidebarTab === 'ai' && (
            <TabsContent value="ai" className="space-y-6 animate-in fade-in duration-150">
              <AiCenterTab analysis={analysis} />
            </TabsContent>
          )}

          {sidebarTab === 'learning' && (
            <TabsContent value="learning" className="space-y-6 animate-in fade-in duration-150">
              <LearningPathTab analysis={analysis} />
            </TabsContent>
          )}

      </div>

      </Tabs>
    </aside>
  );
}
