import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphCanvas } from '@/features/graph/canvas/GraphCanvas';
import { demoGraph } from '@/features/graph/demoGraph';
import { RepoInput } from '@/components/home/RepoInput';
import { fetchAppConfig } from '@/lib/apiClient';

interface HeroSectionProps {
  initialUrl?: string;
}

export function HeroSection({ initialUrl = '' }: HeroSectionProps) {
  const [url] = useState(initialUrl);

  useQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAppConfig,
    staleTime: 1000 * 60 * 60,
  });


  return (
    <section className="relative pt-8 sm:pt-12 pb-12 sm:pb-20 border-b border-[rgba(240,246,252,0.1)] overflow-hidden" id="analyze">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-12">
          {/* Top: Headline + Subtitle + Input */}
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block mb-4 px-2 py-0.5 rounded border border-[rgba(240,246,252,0.1)] bg-[#161b22] text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">
                Graph-first codebase analysis
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#e6edf3] tracking-tight mb-4">
                Map repository architecture from a GitHub URL.
              </h1>
              <p className="text-base text-[#8b949e] leading-relaxed mb-8 max-w-2xl">
                Paste a public repository and inspect its files, dependencies, module boundaries, and architecture notes in one graph-first workspace.
              </p>

              <RepoInput initialUrl={url} />
            </motion.div>
          </div>

          {/* Bottom: Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full"
          >
            <div className="rounded-lg border border-[rgba(240,246,252,0.1)] bg-[#161b22] overflow-hidden shadow-2xl">
              {/* Fake IDE Header */}
              <div className="h-9 border-b border-[rgba(240,246,252,0.1)] bg-[#1c2128] flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-[#8b949e]" />
                    <span className="text-[11px] font-mono text-[#e6edf3]">mbayue/gitSdm</span>
                  </div>
                  <div className="h-3 w-[1px] bg-[rgba(240,246,252,0.1)]" />
                  <span className="text-[11px] font-mono text-[#8b949e]">branch: main</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
                  <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">Parsed</span>
                </div>
              </div>

              <div className="flex h-[480px]">
                {/* Left Sidebar */}
                <div className="w-56 border-r border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-3 hidden md:flex flex-col">
                  <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider mb-3 px-1">Explorer</div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#e6edf3] py-1 px-2 rounded bg-[#1c2128]">
                      <span className="text-[#8b949e]">▼</span>
                      <span>src</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8b949e] py-1 px-2 pl-6 hover:text-[#e6edf3] cursor-default">
                      <span>▶</span>
                      <span>api</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8b949e] py-1 px-2 pl-6 hover:text-[#e6edf3] cursor-default">
                      <span>▶</span>
                      <span>core</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8b949e] py-1 px-2 pl-6 hover:text-[#e6edf3] cursor-default">
                      <span>▶</span>
                      <span>ui</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8b949e] py-1 px-2 pl-6 hover:text-[#e6edf3] cursor-default">
                      <span className="w-2.5" />
                      <span>App.tsx</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8b949e] py-1 px-2 pl-6 hover:text-[#e6edf3] cursor-default">
                      <span className="w-2.5" />
                      <span>index.ts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8b949e] py-1 px-2 hover:text-[#e6edf3] cursor-default mt-2">
                      <span className="w-2.5" />
                      <span>package.json</span>
                    </div>
                  </div>
                </div>

                {/* Center Panel (Graph) */}
                <div className="flex-1 bg-[#0d1117] relative overflow-hidden">
                  <ReactFlowProvider>
                    <GraphCanvas graph={demoGraph} readOnly hideChrome />
                  </ReactFlowProvider>
                  
                  {/* Selected Node State overlay */}
                  <div className="absolute top-4 right-4 p-3 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#1c2128]/90 backdrop-blur-sm max-w-[200px] shadow-lg">
                    <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider mb-1">Selected Module</div>
                    <div className="text-[11px] font-mono text-[#e6edf3] truncate">src/core</div>
                    <div className="mt-2 flex gap-2 text-[10px] text-[#8b949e]">
                      <span className="px-1.5 py-0.5 rounded bg-[#0d1117] border border-[rgba(240,246,252,0.1)]">2 files</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#0d1117] border border-[rgba(240,246,252,0.1)]">4 edges</span>
                    </div>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="w-64 border-l border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-4 hidden lg:block overflow-y-auto no-scrollbar">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">Entry Points</div>
                      <div className="text-[11px] font-mono text-[#e6edf3] truncate hover:text-[#58a6ff] cursor-pointer">src/index.ts</div>
                      <div className="text-[11px] font-mono text-[#e6edf3] truncate hover:text-[#58a6ff] cursor-pointer">src/api/routes.ts</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">High Coupling</div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f85149]" />
                        <span className="text-[11px] font-mono text-[#e6edf3] hover:underline cursor-pointer">src/core/auth.ts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#d29922]" />
                        <span className="text-[11px] font-mono text-[#e6edf3] hover:underline cursor-pointer">src/ui/Button.tsx</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">Suggested Reading</div>
                      <div className="flex flex-col gap-1 text-[11px] font-mono text-[#8b949e]">
                        <span className="flex items-center gap-2"><span className="text-[#30363d]">1.</span> <span className="text-[#e6edf3] hover:text-[#58a6ff] cursor-pointer">src/index.ts</span></span>
                        <span className="flex items-center gap-2"><span className="text-[#30363d]">2.</span> <span className="text-[#e6edf3] hover:text-[#58a6ff] cursor-pointer">src/App.tsx</span></span>
                        <span className="flex items-center gap-2"><span className="text-[#30363d]">3.</span> <span className="text-[#e6edf3] hover:text-[#58a6ff] cursor-pointer">src/core/auth.ts</span></span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">Architecture Notes</div>
                      <p className="text-[11px] text-[#8b949e] leading-relaxed">
                        Core handles business logic and DB connections. UI components are isolated and depend heavily on React. API routes tie auth and DB together.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fake Status Bar */}
              <div className="h-7 border-t border-[rgba(240,246,252,0.1)] bg-[#0d1117] flex items-center justify-between px-4 text-[10px] text-[#8b949e] font-mono">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>318 files</span>
                    <span className="text-[#30363d]">·</span>
                    <span>742 imports</span>
                    <span className="text-[#30363d]">·</span>
                    <span>41 modules</span>
                  </div>
                </div>
                <div>dagre layout</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
