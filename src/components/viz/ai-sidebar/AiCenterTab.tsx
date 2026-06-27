import React from 'react';
import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/vizStore';
import {
  Brain, ShieldAlert, AlertTriangle,
  BookOpen, Wrench, Puzzle, Layers, Network, Star
} from 'lucide-react';
import { Markdownish } from './Markdownish';
import { ToolCard } from './ToolCard';
import { IntelligenceCard } from './IntelligenceCard';
import { ToolSection } from './ToolSection';
import { 
  useAiCenterState,
  healthCache,
  refactorCache,
  roastCache,
  readmeEnhanceCache
} from './hooks/useAiCenterState';
import type { RepoAnalysis, AIRefactorSuggestion } from '@/types';

const firstRow = [
  { key: 'maintainability', label: 'Maintainability', icon: Wrench },
  { key: 'modularity', label: 'Modularity', icon: Puzzle },
  { key: 'readability', label: 'Readability', icon: BookOpen },
] as const;

const secondRow = [
  { key: 'architecture', label: 'Architecture', icon: Layers },
  { key: 'complexity', label: 'Complexity', icon: Network },
] as const;

const getScoreColor = (val: number) => {
  if (val >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500' };
  if (val >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500' };
  return { text: 'text-rose-400', bg: 'bg-rose-500' };
};

interface AiCenterTabProps {
  analysis: RepoAnalysis;
}

interface RiskCardProps {
  s: AIRefactorSuggestion;
  setSelectedNodeId: (id: string | null) => void;
  setFocusedFilePath: (path: string | null) => void;
}

function RiskCard({ 
  s, 
  setSelectedNodeId, 
  setFocusedFilePath 
}: RiskCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-3 space-y-2 hover:border-[rgba(240,246,252,0.3)] transition-all group">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-[#e6edf3] text-xs leading-snug">{s.title}</span>
        <span className={cn(
          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 font-mono",
          s.risk === 'high' ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
          s.risk === 'medium' ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
          "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        )}>
          {s.risk}
        </span>
      </div>
      <div className={cn("text-[11px] text-[#8b949e] leading-relaxed font-sans", !expanded && "line-clamp-2")}>
        {s.description}
      </div>
      {s.files && s.files.length > 0 && expanded && (
        <div className="pt-2 border-t border-[rgba(240,246,252,0.1)] mt-2">
          <span className="text-[9px] font-mono text-[#8b949e] uppercase tracking-widest mb-1 block">Affected Files</span>
          <div className="flex flex-wrap gap-1">
            {s.files.map((f: string) => (
              <button 
                key={f}
                onClick={() => {
                  setSelectedNodeId(f);
                  setFocusedFilePath(f);
                }}
                className="text-[9px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 hover:bg-[#58a6ff]/20 px-1.5 py-0.5 rounded transition-colors"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] font-medium pt-1 w-full text-left"
      >
        {expanded ? "Collapse full analysis" : "Expand full analysis"}
      </button>
    </div>
  );
}

export function AiCenterTab({ analysis }: AiCenterTabProps) {
  const {
    owner,
    repo,
    selectedBranch,
    eli5Mode,
    toggleEli5Mode,
    activePlayground,
    setActivePlayground,
    aiSubTab,
    setAiSubTab,
    healthSubMode,
    setHealthSubMode,
    currentExplanation,
    cardTitle,
    cardSubtitle,
    cardLoading,
    readmeCopied,
    setReadmeCopied,
    healthData,
    refactorData,
    roastData,
    readmeEnhanceData,
    health,
    refactor,
    roast,
    readmeEnhance,
    healthKey,
    refactorKey,
    roastKey,
    readmeEnhanceKey,
    pendingToolRequests,
  } = useAiCenterState(analysis);

  return (
    <div className="space-y-5">
      {/* Intelligence Response Card */}
      <IntelligenceCard
        title={cardTitle}
        subtitle={cardSubtitle}
        badgeLabel={(aiSubTab !== 'health' && aiSubTab !== 'playground') ? "ELI5 MODE" : undefined}
        badgeActive={eli5Mode}
        onBadgeToggle={toggleEli5Mode}
        isLoading={cardLoading}
        headerAction={aiSubTab === 'playground' && activePlayground === 'readme' && readmeEnhanceData ? (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(readmeEnhanceData.readme);
              setReadmeCopied(true);
              window.setTimeout(() => setReadmeCopied(false), 1400);
            }}
            className={cn(
              "flex items-center gap-1.5 h-6 px-2.5 rounded-sm text-[9px] font-bold transition-all border select-none shrink-0",
              readmeCopied
                ? "bg-[#1c2128] text-[#58a6ff] border-[rgba(240,246,252,0.1)]"
                : "bg-transparent text-[#8b949e] border-[rgba(240,246,252,0.1)] hover:border-[rgba(240,246,252,0.3)] hover:text-[#e6edf3]"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              readmeCopied ? "bg-[#58a6ff] scale-110" : "bg-[#8b949e]"
            )} />
            {readmeCopied ? 'COPIED' : 'COPY'}
          </button>
        ) : undefined}
      >
        {aiSubTab === 'health' ? (
          <div className="space-y-4">
            {healthSubMode === 'audit' ? (
              <>
                <p className="text-[11px] text-[#8b949e] leading-relaxed">
                  {analysis.meta.description || 'This repository follows a modular architecture with clear separation between API routes, shared server logic, and a React frontend.'}
                </p>
                {healthData && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {firstRow.map((dim) => {
                        const val = healthData.scores[dim.key as keyof typeof healthData.scores] ?? 0;
                        const colors = getScoreColor(val);
                        const Icon = dim.icon;
                        return (
                          <div key={dim.key} className="bg-[#161b22] border border-[rgba(240,246,252,0.1)] rounded-md p-2.5 flex flex-col justify-between min-h-[70px] transition-all hover:border-[rgba(240,246,252,0.3)]">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
                              <span className="text-[8px] font-bold uppercase tracking-wider text-[#8b949e] truncate">{dim.label}</span>
                            </div>
                            <div className="mt-1">
                              <div className={cn("text-base font-bold font-mono", colors.text)}>{val}%</div>
                              <div className="h-1 w-full bg-zinc-900/80 rounded-full mt-1.5 overflow-hidden">
                                <div className={cn("h-full rounded-full", colors.bg)} style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {secondRow.map((dim) => {
                        const val = healthData.scores[dim.key as keyof typeof healthData.scores] ?? 0;
                        const colors = getScoreColor(val);
                        const Icon = dim.icon;
                        return (
                          <div key={dim.key} className="bg-[#161b22] border border-[rgba(240,246,252,0.1)] rounded-md p-2.5 flex flex-col justify-between min-h-[70px] transition-all hover:border-[rgba(240,246,252,0.3)]">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
                              <span className="text-[8px] font-bold uppercase tracking-wider text-[#8b949e] truncate">{dim.label}</span>
                            </div>
                            <div className="mt-1">
                              <div className={cn("text-base font-bold font-mono", colors.text)}>{val}%</div>
                              <div className="h-1 w-full bg-zinc-900/80 rounded-full mt-1.5 overflow-hidden">
                                <div className={cn("h-full rounded-full", colors.bg)} style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {healthData?.summary && (
                  <div className="flex items-start gap-1.5 text-[11px] italic text-[#8b949e] mt-3 pl-1 leading-normal border-l-2 border-[#58a6ff]/40">
                    <p className="leading-relaxed">{healthData.summary}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {refactorData?.suggestions && refactorData.suggestions.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest pl-1 font-mono">Key Refactoring Suggestions & Risks</h4>
                    <div className="space-y-2.5">
                      {refactorData.suggestions.map((s, idx) => (
                        <RiskCard 
                          key={idx} 
                          s={s} 
                          setSelectedNodeId={useVizStore.getState().setSelectedNodeId} 
                          setFocusedFilePath={useVizStore.getState().setFocusedFilePath} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#8b949e] italic py-4 text-center text-xs">Run a diagnosis to identify codebase risks.</div>
                )}
              </>
            )}
          </div>
        ) : aiSubTab === 'playground' ? (
          <div className="space-y-4">
            {activePlayground === 'roast' && (
              roastData ? <Markdownish text={roastData.roast} /> : <div className="text-[#8b949e] italic py-4 text-center text-xs">Ready to get roasted? Select Repo Roast below.</div>
            )}
            {activePlayground === 'readme' && (
              readmeEnhanceData ? (
                <Markdownish text={readmeEnhanceData.readme} />
              ) : <div className="text-[#8b949e] italic py-4 text-center text-xs">Ready to enhance your README? Select Readme Enhancer below.</div>
            )}
          </div>
        ) : (
          currentExplanation ? (
            <Markdownish text={currentExplanation} />
          ) : (
            <span className="text-[#8b949e] italic text-xs">Select a node in the graph or use the actions below to generate architectural analysis.</span>
          )
        )}
      </IntelligenceCard>

      {/* Action Tool Cards sections */}
      <div className="space-y-5">
        <ToolSection title="Core Analysis">
          <div className="grid grid-cols-1 gap-2.5">
            <ToolCard 
              label="Explain Selection" 
              subtitle="Analyze selected node or file"
              icon={Brain} 
              color="text-blue-400" 
              active={aiSubTab === 'explain'}
              onClick={() => {
                setAiSubTab('explain');
              }} 
            />
            <div className="grid grid-cols-2 gap-2.5">
              <ToolCard 
                label="Health Audit" 
                icon={ShieldAlert} 
                color="text-emerald-400" 
                compact
                active={aiSubTab === 'health' && healthSubMode === 'audit'}
                onClick={() => {
                  setAiSubTab('health');
                  setHealthSubMode('audit');
                  if (!healthData && !health.isPending && !pendingToolRequests.has(healthKey)) {
                    pendingToolRequests.add(healthKey);
                    health.mutate({ owner, repo, branch: selectedBranch || undefined }, {
                      onSuccess: (data) => healthCache.set(healthKey, data),
                      onSettled: () => pendingToolRequests.delete(healthKey),
                    });
                  }
                }} 
              />
              <ToolCard 
                label="Identify Risks" 
                icon={AlertTriangle} 
                color="text-amber-400" 
                compact
                active={aiSubTab === 'health' && healthSubMode === 'risks'}
                onClick={() => {
                  setAiSubTab('health');
                  setHealthSubMode('risks');
                  if (!refactorData && !refactor.isPending && !pendingToolRequests.has(refactorKey)) {
                    pendingToolRequests.add(refactorKey);
                    refactor.mutate({ owner, repo, branch: selectedBranch || undefined }, {
                      onSuccess: (data) => refactorCache.set(refactorKey, data),
                      onSettled: () => pendingToolRequests.delete(refactorKey),
                    });
                  }
                }} 
              />
            </div>
          </div>
        </ToolSection>

        <ToolSection title="Creative Tools">
          <div className="grid grid-cols-2 gap-2.5">
            <ToolCard 
              label="Repo Roast" 
              icon={Star} 
              color="text-rose-400" 
              compact
              active={aiSubTab === 'playground' && activePlayground === 'roast'}
              onClick={() => {
                setAiSubTab('playground');
                setActivePlayground('roast');
                if (!roastData && !roast.isPending && !pendingToolRequests.has(roastKey)) {
                  pendingToolRequests.add(roastKey);
                  roast.mutate({ owner, repo, branch: selectedBranch || undefined }, {
                    onSuccess: (data) => roastCache.set(roastKey, data),
                    onSettled: () => pendingToolRequests.delete(roastKey),
                  });
                }
              }} 
            />
            <ToolCard 
              label="Readme Enhancer" 
              icon={BookOpen} 
              color="text-cyan-400" 
              compact
              active={aiSubTab === 'playground' && activePlayground === 'readme'}
              onClick={() => {
                setAiSubTab('playground');
                setActivePlayground('readme');
                if (!readmeEnhanceData && !readmeEnhance.isPending && !pendingToolRequests.has(readmeEnhanceKey)) {
                  pendingToolRequests.add(readmeEnhanceKey);
                  readmeEnhance.mutate({ owner, repo, branch: selectedBranch || undefined }, {
                    onSuccess: (data) => readmeEnhanceCache.set(readmeEnhanceKey, data),
                    onSettled: () => pendingToolRequests.delete(readmeEnhanceKey),
                  });
                }
              }} 
            />
          </div>
        </ToolSection>
      </div>
    </div>
  );
}
