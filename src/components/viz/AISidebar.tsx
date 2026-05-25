import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Map, ShieldAlert, Flame, Package, Copy, Download, RefreshCw,
  Sparkles, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVizStore, type SidebarTab } from '@/stores/viz-store';
import {
  useExplain, useExplainNew, useArchitecture, useRefactor,
  useHealth, useMermaid, useRoast, useReadmeEnhance
} from '@/features/ai/useAI';
import type { RepoAnalysis } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

import { LearningPathTab } from './LearningPathTab';

const tabs = [
  { id: 'start' as SidebarTab, label: 'Onboarding', icon: Sparkles },
  { id: 'explain' as SidebarTab, label: 'Explain', icon: Brain },
  { id: 'architecture' as SidebarTab, label: 'Architecture', icon: Map },
  { id: 'health' as SidebarTab, label: 'Health', icon: ShieldAlert },
  { id: 'dependencies' as SidebarTab, label: 'Packages', icon: Package },
  { id: 'playground' as SidebarTab, label: 'Playground', icon: Flame },
];

interface AISidebarProps {
  analysis: RepoAnalysis;
}

export function AISidebar({ analysis }: AISidebarProps) {
  const {
    sidebarTab,
    setSidebarTab,
    selectedNodeId,
    setSelectedNodeId,
    setToastMessage,
  } = useVizStore();

  const [eli5Mode, setEli5Mode] = useState(false);
  const [activePlayground, setActivePlayground] = useState<'roast' | 'readme'>('roast');
  const [activeArchitecture, setActiveArchitecture] = useState<'layers' | 'mermaid'>('layers');

  const explain = useExplain();
  const explainNew = useExplainNew();
  const architecture = useArchitecture();
  const health = useHealth();
  const refactor = useRefactor();
  const mermaid = useMermaid();
  const roast = useRoast();
  const readmeEnhance = useReadmeEnhance();

  const { owner, repo } = analysis.meta;

  const selectedNode = selectedNodeId
    ? analysis.graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  // Trigger standard explain when tab or node changes
  useEffect(() => {
    if (sidebarTab === 'explain' && !selectedNodeId && eli5Mode) {
      if (!explainNew.data && !explainNew.isPending) {
        explainNew.mutate({ owner, repo });
      }
    } else if (sidebarTab === 'explain') {
      if (!explain.data && !explain.isPending) {
        explain.mutate({
          owner,
          repo,
          scope: selectedNodeId ? 'node' : 'repo',
          nodeId: selectedNodeId ?? undefined,
        });
      }
    }
  }, [sidebarTab, owner, repo, selectedNodeId, eli5Mode]);

  // Trigger architecture details
  useEffect(() => {
    if (sidebarTab === 'architecture' && !architecture.data && !architecture.isPending) {
      architecture.mutate({ owner, repo });
    }
  }, [sidebarTab, owner, repo]);

  // Trigger health report & refactoring
  useEffect(() => {
    if (sidebarTab === 'health') {
      if (!health.data && !health.isPending) {
        health.mutate({ owner, repo });
      }
      if (!refactor.data && !refactor.isPending) {
        refactor.mutate({ owner, repo });
      }
    }
  }, [sidebarTab, owner, repo]);

  // Trigger playground modules
  useEffect(() => {
    if (sidebarTab === 'playground') {
      if (activePlayground === 'roast' && !roast.data && !roast.isPending) {
        roast.mutate({ owner, repo });
      } else if (activePlayground === 'readme' && !readmeEnhance.data && !readmeEnhance.isPending) {
        readmeEnhance.mutate({ owner, repo });
      }
    }
  }, [sidebarTab, activePlayground, owner, repo]);

  // Trigger mermaid generation
  const handleGenerateMermaid = () => {
    mermaid.mutate({ owner, repo });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(text.slice(0, 100) + '...');
  };

  const downloadMermaidAsFile = (text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${repo}_architecture.mermaid`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isExplainLoading = eli5Mode && !selectedNodeId ? explainNew.isPending : explain.isPending;
  const currentExplanation = eli5Mode && !selectedNodeId ? explainNew.data?.explanation : explain.data?.explanation;

  return (
    <aside className="flex h-full w-full flex-col border-l border-white/5 bg-zinc-950/60 shadow-2xl backdrop-blur-xl">
      {/* Sidebar Navigation Tabs */}
      <div className="flex items-center border-b border-white/5 bg-zinc-950/40 px-1.5 py-1 gap-0.5 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSidebarTab(t.id)}
            title={t.label}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150',
              sidebarTab === t.id
                ? 'bg-violet-600/15 dark:text-violet-200 text-violet-700 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.1)] px-2.5 py-1.5 text-[10px]'
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border border-transparent w-8 h-8 shrink-0',
            )}
          >
            <t.icon className={cn(
              sidebarTab === t.id ? 'h-3 w-3 dark:text-violet-400 text-violet-600' : 'h-4 w-4'
            )} />
            {sidebarTab === t.id && <span className="whitespace-nowrap">{t.label}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm scroll-mt-2 scrollbar-thin">
        <AnimatePresence mode="wait">
          {/* TAB 0: START HERE */}
          {sidebarTab === 'start' && (
            <TabPanel key="start">
              <LearningPathTab analysis={analysis} />
            </TabPanel>
          )}

          {/* TAB 1: EXPLAIN */}
          {sidebarTab === 'explain' && (

            <TabPanel key="explain">
              {/* Selected Node or Repo Header */}
              {selectedNode ? (
                <div className="mb-4 rounded-xl border border-white/5 bg-zinc-900/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-wider dark:text-violet-400 text-violet-700 dark:bg-violet-500/10 bg-violet-500/15 px-2 py-0.5 rounded-full border dark:border-violet-500/20 border-violet-500/30">
                      {selectedNode.type}
                    </span>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white truncate" title={selectedNode.data.path || selectedNode.data.label}>
                    {selectedNode.data.label}
                  </h3>
                  {selectedNode.data.path && (
                    <code className="mt-1 block text-[10px] dark:text-cyan-400/80 text-cyan-700 truncate font-mono">
                      {selectedNode.data.path}
                    </code>
                  )}
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-white/5 bg-zinc-900/30 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-wider dark:text-cyan-400 text-cyan-700 dark:bg-cyan-500/10 bg-cyan-500/15 px-2 py-0.5 rounded-full border dark:border-cyan-500/20 border-cyan-500/30">
                      Repository Overview
                    </span>
                    {/* ELI5 Toggle Button */}
                    <button
                      onClick={() => setEli5Mode(!eli5Mode)}
                      className={cn(
                        "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] border transition-all",
                        eli5Mode
                          ? "bg-violet-500/20 border-violet-500/30 dark:text-violet-300 text-violet-700"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>ELI5 Mode</span>
                    </button>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white">
                    {analysis.meta.fullName}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 leading-normal line-clamp-2">
                    {analysis.meta.description || 'No description provided.'}
                  </p>
                </div>
              )}

              {/* Explaining Text */}
              {isExplainLoading ? (
                <div className="space-y-4">
                  <div className="ai-explain-loading rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-[11px] uppercase tracking-[0.24em] dark:text-violet-200 text-violet-700">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent dark:border-violet-200 border-violet-700 animate-spin" />
                      Synthesizing Explain...
                    </div>
                  </div>
                  <LoadingBlocks />
                </div>
              ) : (
                <Markdownish text={currentExplanation ?? 'No explanation generated.'} />
              )}
            </TabPanel>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {sidebarTab === 'architecture' && (
            <TabPanel key="architecture">
              <div className="mb-4 flex border-b border-white/5 p-0.5 gap-1 bg-zinc-900/40 rounded-lg">
                <button
                  onClick={() => setActiveArchitecture('layers')}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded font-medium transition-all",
                    activeArchitecture === 'layers'
                      ? "bg-white/5 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  System Layers
                </button>
                <button
                  onClick={() => setActiveArchitecture('mermaid')}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded font-medium transition-all",
                    activeArchitecture === 'mermaid'
                      ? "bg-white/5 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Mermaid Diagram
                </button>
              </div>

              {activeArchitecture === 'layers' ? (
                architecture.isPending ? (
                  <LoadingBlocks />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">System Architecture</h4>
                      <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                        {architecture.data?.overview}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Architectural Modules</h4>
                      {architecture.data?.layers.map((layer, i) => (
                        <div key={i} className="rounded-lg border border-white/5 bg-zinc-900/20 p-2.5">
                          <h5 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full dark:bg-violet-400 bg-violet-600" />
                            {layer.name}
                          </h5>
                          <p className="mt-1 text-[11px] text-zinc-400 leading-normal">{layer.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {!mermaid.data && !mermaid.isPending ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-zinc-900/20 p-8 text-center">
                      <Map className="h-10 w-10 text-zinc-600 mb-2" />
                      <h4 className="text-sm font-semibold text-white">Generate Code Flowchart</h4>
                      <p className="mt-1 text-xs text-zinc-500 max-w-[240px] mx-auto">
                        Analyze file imports and modules to build a beautiful visual architecture diagram in Mermaid.js.
                      </p>
                      <button
                        onClick={handleGenerateMermaid}
                        className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-all shadow-[0_0_15px_rgba(109,40,217,0.3)] hover:scale-[1.02]"
                      >
                        Generate Diagram
                      </button>
                    </div>
                  ) : mermaid.isPending ? (
                    <div className="space-y-4">
                      <div className="ai-explain-loading rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-[11px] uppercase tracking-[0.24em] dark:text-violet-200 text-violet-700">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent dark:border-violet-200 border-violet-700 animate-spin" />
                          Mapping Flowchart...
                        </div>
                      </div>
                      <LoadingBlocks />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">Mermaid Diagram Source</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => copyToClipboard(mermaid.data?.diagram ?? '')}
                            title="Copy Mermaid Code"
                            className="flex h-7 w-7 items-center justify-center rounded bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => downloadMermaidAsFile(mermaid.data?.diagram ?? '')}
                            title="Download File"
                            className="flex h-7 w-7 items-center justify-center rounded bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleGenerateMermaid}
                            title="Regenerate"
                            className="flex h-7 w-7 items-center justify-center rounded bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-zinc-900 border border-white/5 p-3 text-xs font-mono text-zinc-300 max-h-[350px] scrollbar-thin">
                        <code>{mermaid.data?.diagram}</code>
                      </pre>
                      <div className="rounded-lg border border-violet-500/10 bg-violet-500/5 p-3">
                        <p className="text-[11px] dark:text-violet-300 text-violet-700 leading-normal">
                          💡 **Tip**: Copy this code block and paste it directly into your GitHub README or Notion documents to render a visual chart!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabPanel>
          )}

          {/* TAB 3: HEALTH & QUALITY */}
          {sidebarTab === 'health' && (
            <TabPanel key="health">
              {health.isPending || refactor.isPending ? (
                <div className="space-y-4">
                  <div className="ai-explain-loading rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-[11px] uppercase tracking-[0.24em] dark:text-violet-200 text-violet-700">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent dark:border-violet-200 border-violet-700 animate-spin" />
                      Evaluating Quality Metrics...
                    </div>
                  </div>
                  <LoadingBlocks />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Health Metrics Grid */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Codebase Health Scores</h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: 'Maintainability', val: health.data?.scores.maintainability ?? 80 },
                        { label: 'Modularity', val: health.data?.scores.modularity ?? 80 },
                        { label: 'Readability', val: health.data?.scores.readability ?? 80 },
                        { label: 'Architecture', val: health.data?.scores.architecture ?? 80 },
                      ].map((item, idx) => {
                        const isGood = item.val >= 80;
                        const isOkay = item.val >= 60 && item.val < 80;
                        const scoreColor = isGood ? 'text-emerald-400' : isOkay ? 'text-amber-400' : 'text-rose-400';
                        const scoreBg = isGood ? 'bg-emerald-500/5 border-emerald-500/10' : isOkay ? 'bg-amber-500/5 border-amber-500/10' : 'bg-rose-500/5 border-rose-500/10';

                        return (
                          <div key={idx} className={cn("rounded-xl border p-3 flex flex-col justify-between", scoreBg)}>
                            <span className="text-[10px] font-medium text-zinc-500 uppercase">{item.label}</span>
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className={cn("text-2xl font-bold font-mono tracking-tight", scoreColor)}>{item.val}</span>
                              <span className="text-[10px] text-zinc-600 font-semibold">/100</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Health Summary */}
                  <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-3.5">
                    <h5 className="text-xs font-semibold text-white mb-1.5">Codebase Diagnosis</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">{health.data?.summary}</p>
                  </div>

                  {/* Refactor Suggestions */}
                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      Refactoring Suggestions
                    </h4>

                    {refactor.data?.suggestions.map((sug, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-zinc-900/20 p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 uppercase">
                            {sug.category}
                          </span>
                          <span className={cn(
                            "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                            sug.risk === 'high' ? 'bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20' :
                              sug.risk === 'medium' ? 'bg-amber-500/10 dark:text-amber-400 text-amber-700 border border-amber-500/20' :
                                'bg-cyan-500/10 dark:text-cyan-400 text-cyan-700 border border-cyan-500/20'
                          )}>
                            {sug.risk} risk
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-white leading-snug">{sug.title}</h5>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{sug.description}</p>

                        {sug.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-[9px] font-semibold text-zinc-500 uppercase block">Refactor target files:</span>
                            <div className="flex flex-wrap gap-1">
                              {sug.files.map((file, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedNodeId(file)}
                                  className="rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[10px] dark:text-cyan-400/80 text-cyan-700 hover:bg-white/10 hover:text-white transition-all text-left truncate max-w-full"
                                >
                                  {file}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabPanel>
          )}

          {/* TAB 4: PLAYGROUND */}
          {sidebarTab === 'playground' && (
            <TabPanel key="playground">
              {/* Selector */}
              <div className="mb-4 flex border-b border-white/5 p-0.5 gap-1 bg-zinc-900/40 rounded-lg">
                <button
                  onClick={() => setActivePlayground('roast')}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded font-medium transition-all",
                    activePlayground === 'roast'
                      ? "bg-white/5 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Repo Roast 🔥
                </button>
                <button
                  onClick={() => setActivePlayground('readme')}
                  className={cn(
                    "flex-1 py-1.5 text-xs rounded font-medium transition-all",
                    activePlayground === 'readme'
                      ? "bg-white/5 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  README Enhancer
                </button>
              </div>

              {activePlayground === 'roast' ? (
                roast.isPending ? (
                  <div className="space-y-4">
                    <div className="ai-explain-loading rounded-lg border-rose-500/20 bg-rose-500/10 p-3 text-[11px] uppercase tracking-[0.24em] dark:text-rose-300 text-rose-700">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent dark:border-rose-400 border-rose-700 animate-spin" />
                        Igniting Codebase Roast...
                      </div>
                    </div>
                    <LoadingBlocks />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 relative overflow-hidden">
                      {/* Ambient flame glow */}
                      <div className="absolute right-0 bottom-0 -z-10 h-32 w-32 rounded-full bg-rose-500/5 blur-3xl" />
                      <div className="text-xs leading-relaxed text-zinc-300 whitespace-pre-line font-medium italic">
                        {roast.data?.roast}
                      </div>
                    </div>
                    <button
                      onClick={() => roast.mutate({ owner, repo })}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold dark:text-rose-300 text-rose-700 hover:bg-rose-500/20 transition-all font-mono"
                    >
                      <Flame className="h-4 w-4" />
                      Roast Codebase Again
                    </button>
                  </div>
                )
              ) : (
                readmeEnhance.isPending ? (
                  <div className="space-y-4">
                    <div className="ai-explain-loading rounded-lg border-violet-500/20 bg-violet-500/10 p-3 text-[11px] uppercase tracking-[0.24em] dark:text-violet-300 text-violet-700">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-t-transparent dark:border-violet-300 border-violet-700 animate-spin" />
                        Generating README...
                      </div>
                    </div>
                    <LoadingBlocks />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500">Enhanced README.md Output</span>
                      <button
                        onClick={() => copyToClipboard(readmeEnhance.data?.readme ?? '')}
                        className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white transition-all font-medium"
                      >
                        <Copy className="h-3 w-3" />
                        Copy Markdown
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-zinc-900 border border-white/5 p-3 text-[11px] font-mono text-zinc-400 max-h-[350px] scrollbar-thin whitespace-pre-wrap leading-relaxed">
                      <code>{readmeEnhance.data?.readme}</code>
                    </pre>
                  </div>
                )
              )}
            </TabPanel>
          )}

          {/* TAB 5: DEPENDENCIES */}
          {sidebarTab === 'dependencies' && (
            <TabPanel key="dependencies">
              <div className="space-y-3">
                {analysis.dependencies.length ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Project Dependencies ({analysis.dependencies.length})
                    </h4>
                    <ul className="space-y-2">
                      {analysis.dependencies.map((dep, idx) => (
                        <li key={idx}>
                          <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-3 flex items-center justify-between gap-3 hover:border-violet-500/10 transition-all">
                            <div>
                              <div className="font-mono text-xs font-semibold text-white">{dep.name}</div>
                              <div className="mt-1 text-[10px] text-zinc-500">
                                {dep.ecosystem}{dep.version ? ` · ${dep.version}` : ''}
                              </div>
                            </div>
                            <span className={cn(
                              "rounded px-1.5 py-0.5 text-[8px] font-bold uppercase border",
                              dep.type === 'dev'
                                ? 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                                : 'bg-violet-500/10 dark:text-violet-400 text-violet-750 border-violet-500/20'
                            )}>
                              {dep.type}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                    <Package className="h-8 w-8 text-zinc-500 mb-2" />
                    <p className="text-xs">No project dependencies detected in manifest files.</p>
                  </div>
                )}
              </div>
            </TabPanel>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function LoadingBlocks() {
  return (
    <div className="space-y-3 mt-4">
      <Skeleton className="h-4 w-full bg-zinc-800/30" />
      <Skeleton className="h-4 w-5/6 bg-zinc-800/30" />
      <Skeleton className="h-16 w-full bg-zinc-800/20" />
      <Skeleton className="h-4 w-3/4 bg-zinc-800/30" />
    </div>
  );
}

function Markdownish({ text }: { text: string }) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        steps?: { title: string; description: string; filePath?: string }[];
        overview?: string;
        explanation?: string;
      };
      if (parsed.steps?.length) {
        return (
          <ol className="space-y-3">
            {parsed.steps.map((step, i) => (
              <li key={i} className="rounded-xl border border-white/5 bg-zinc-900/50 p-3.5 hover:border-violet-500/10 transition-all">
                <p className="font-semibold text-white text-xs">{step.title}</p>
                <p className="mt-1 text-[11px] text-zinc-400 leading-normal">{step.description}</p>
                {step.filePath && (
                  <code className="mt-2 block text-[9px] font-mono dark:text-cyan-400/80 text-cyan-700 truncate">
                    {step.filePath}
                  </code>
                )}
              </li>
            ))}
          </ol>
        );
      }
      if (parsed.overview) {
        return <p className="text-xs leading-relaxed text-zinc-300">{parsed.overview}</p>;
      }
      if (parsed.explanation) {
        return <p className="text-xs leading-relaxed text-zinc-300">{parsed.explanation}</p>;
      }
    } catch {
      // fall through to plain text markdown
    }
  }

  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let insideCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (insideCodeBlock) {
        renderedElements.push(
          <pre key={`code-${codeBlockKey++}`} className="my-2.5 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-[11px] font-mono text-zinc-300 border border-white/5 max-h-60 scrollbar-thin">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        insideCodeBlock = false;
      } else {
        insideCodeBlock = true;
      }
      continue;
    }

    if (insideCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('# ')) {
      renderedElements.push(
        <h1 key={i} className="mt-4 mb-2 text-sm font-bold text-white tracking-tight">
          {renderInline(trimmedLine.slice(2))}
        </h1>
      );
    } else if (trimmedLine.startsWith('## ')) {
      renderedElements.push(
        <h2 key={i} className="mt-3.5 mb-2 text-xs font-semibold text-white tracking-tight">
          {renderInline(trimmedLine.slice(3))}
        </h2>
      );
    } else if (trimmedLine.startsWith('### ')) {
      renderedElements.push(
        <h3 key={i} className="mt-3 mb-1.5 text-xs font-semibold dark:text-violet-300 text-violet-700 tracking-tight">
          {renderInline(trimmedLine.slice(4))}
        </h3>
      );
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      renderedElements.push(
        <div key={i} className="ml-3 flex items-start gap-2 my-1">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full dark:bg-violet-400 bg-violet-600 animate-pulse" />
          <span className="text-xs leading-relaxed text-zinc-400">
            {renderInline(trimmedLine.slice(2))}
          </span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\.\s(.*)/);
      if (match) {
        renderedElements.push(
          <div key={i} className="ml-3 flex items-start gap-1.5 my-1">
            <span className="text-[11px] font-mono dark:text-violet-400 text-violet-600 mt-0.5 shrink-0">{match[1]}.</span>
            <span className="text-xs leading-relaxed text-zinc-400">
              {renderInline(match[2])}
            </span>
          </div>
        );
      }
    } else if (trimmedLine !== '') {
      renderedElements.push(
        <p key={i} className="text-xs leading-relaxed text-zinc-400 my-2">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div className="space-y-1">{renderedElements}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-[10px] dark:text-cyan-400 text-cyan-700 border border-white/5">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
