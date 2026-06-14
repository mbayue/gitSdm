import { cn } from '@/lib/utils';
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
import type { RepoAnalysis } from '@/types';

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
              "flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[9px] font-bold transition-all border select-none shrink-0",
              readmeCopied
                ? "bg-violet-500/15 text-violet-300 border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                : "bg-zinc-900/60 text-zinc-500 border-white/[0.04] hover:border-white/10 hover:text-zinc-400"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full transition-all shadow-[0_0_6px_currentColor]",
              readmeCopied ? "bg-violet-400 scale-110" : "bg-zinc-600"
            )} />
            {readmeCopied ? 'COPIED' : 'COPY'}
          </button>
        ) : undefined}
      >
        {aiSubTab === 'health' ? (
          <div className="space-y-4">
            {healthSubMode === 'audit' ? (
              <>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
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
                          <div key={dim.key} className="bg-zinc-950/60 border border-white/[0.04] rounded-xl p-2.5 flex flex-col justify-between min-h-[76px] transition-all hover:border-white/[0.08]">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 truncate">{dim.label}</span>
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
                          <div key={dim.key} className="bg-zinc-950/60 border border-white/[0.04] rounded-xl p-2.5 flex flex-col justify-between min-h-[76px] transition-all hover:border-white/[0.08]">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 truncate">{dim.label}</span>
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
                  <div className="flex items-start gap-1.5 text-[11px] italic text-zinc-400 mt-3 pl-1 leading-normal border-l-2 border-violet-500/20">
                    <p className="leading-relaxed">{healthData.summary}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {refactorData?.suggestions && refactorData.suggestions.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 font-mono">Key Refactoring Suggestions & Risks</h4>
                    <div className="space-y-2.5">
                      {refactorData.suggestions.map((s, idx) => (
                        <div key={idx} className="rounded-xl border border-white/5 bg-zinc-950/30 p-3.5 space-y-2 hover:border-amber-500/20 transition-all group">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-white text-xs leading-snug group-hover:text-amber-300 transition-colors">{s.title}</span>
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 font-mono",
                              s.risk === 'high' ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                              s.risk === 'medium' ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                              "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            )}>
                              {s.risk} risk
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 italic py-4 text-center">Run a diagnosis to identify codebase risks.</div>
                )}
              </>
            )}
          </div>
        ) : aiSubTab === 'playground' ? (
          <div className="space-y-4">
            {activePlayground === 'roast' && (
              roastData ? <Markdownish text={roastData.roast} /> : <div className="text-zinc-500 italic py-4 text-center">Ready to get roasted? Select Repo Roast below.</div>
            )}
            {activePlayground === 'readme' && (
              readmeEnhanceData ? (
                <Markdownish text={readmeEnhanceData.readme} />
              ) : <div className="text-zinc-500 italic py-4 text-center">Ready to enhance your README? Select Readme Enchanter below.</div>
            )}
          </div>
        ) : (
          currentExplanation ? (
            <Markdownish text={currentExplanation} />
          ) : (
            <span className="text-zinc-500 italic">Select a node in the graph or use the actions below to generate AI insights.</span>
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
              color="text-violet-400" 
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
