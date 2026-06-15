import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Zap, GitBranch, Brain, Network } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { GraphCanvas } from '@/features/graph/canvas/GraphCanvas';
import { demoGraph } from '@/features/graph/demoGraph';
import { getVisibleRepoPresets } from '@/components/home/repoPresets';
import { fetchAppConfig } from '@/lib/apiClient';
import { parseRepoFromUrl, LAST_REPO_KEY } from '@/lib/utils';

interface HeroSectionProps {
  initialUrl?: string;
}

export function HeroSection({ initialUrl = '' }: HeroSectionProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { data: config } = useQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAppConfig,
    staleTime: 1000 * 60 * 60,
  });

  const showMockPresets = config?.aiProvider === 'mock';
  const presets = useMemo(
    () => getVisibleRepoPresets(showMockPresets).slice(0, 5),
    [showMockPresets],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseRepoFromUrl(url);
    if (!parsed) {
      setError('Enter a valid GitHub URL or owner/repo (e.g. facebook/react)');
      return;
    }
    localStorage.setItem(LAST_REPO_KEY, url);
    setLoading(true);
    try {
      navigate(`/${parsed.owner}/${parsed.repo}`, { state: { pendingUrl: url } });
    } catch {
      setError('Failed to navigate');
      setLoading(false);
    }
  };

  return (
    <section className="relative pt-24 pb-8 overflow-hidden" id="analyze">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/8 blur-[160px]" />
      <div className="absolute top-1/3 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-[#22d3ee]/5 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column: headline + input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]">
                <Brain className="h-3 w-3" />
                AI-native repository intelligence
              </Badge>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#f8fafc] leading-[1.1] mb-5">
              Understand any
              <br />
              <span className="bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#22d3ee] bg-clip-text text-transparent">
                codebase instantly
              </span>
            </h1>

            <p className="text-lg text-[#a1a1aa] leading-relaxed mb-8 max-w-lg">
              Paste a GitHub repo, get a dependency graph, architecture map, and AI-powered walkthrough in seconds.
            </p>

            {/* Repo input */}
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <GitBranch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]/60" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="github.com/owner/repo or owner/repo"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-[#272233] bg-[#0f0f17] pl-10 pr-4 text-sm text-[#f8fafc] placeholder-[#a1a1aa]/50 outline-none focus:border-[#8b5cf6]/50 focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 px-6 bg-gradient-to-r from-[#8b5cf6] to-[#22d3ee] text-white border-0 hover:opacity-90 shadow-[0_0_24px_rgba(139,92,246,0.25)] text-sm font-semibold gap-2"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Analyze
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              )}
            </form>

            {/* Example chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa]/60">Try:</span>
              {presets.map((item) => (
                <button
                  key={item.repo}
                  type="button"
                  onClick={() => { setUrl(`https://github.com/${item.repo}`); setError(''); }}
                  className="rounded-lg border border-[#272233] bg-[#0f0f17] px-2.5 py-1 text-[11px] font-medium text-[#a1a1aa] hover:border-[#8b5cf6]/40 hover:text-[#f8fafc] hover:bg-[#8b5cf6]/5 transition-all cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right column: live preview card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <Card className="relative overflow-hidden border-[#272233] bg-background p-0">
              {/* Graph preview */}
              <div className="relative h-[320px] w-full overflow-hidden bg-background">
                <ReactFlowProvider>
                  <GraphCanvas graph={demoGraph} readOnly hideChrome />
                </ReactFlowProvider>
              </div>

              {/* Info panel below graph */}
              <div className="border-t border-[#272233] bg-[#0f0f17]/80 p-5 space-y-4">
                {/* Mini AI summary */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                    <Brain className="h-4 w-4 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#f8fafc] mb-0.5">AI Summary</p>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      React-based SPA with Express API layer. 47 modules, 3 circular deps detected. Entry: src/main.tsx
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-md bg-[#161622] px-2.5 py-1.5 border border-[#272233]">
                    <Network className="h-3 w-3 text-[#22d3ee]" />
                    <span className="text-[11px] font-mono text-[#f8fafc]">47 nodes</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-[#161622] px-2.5 py-1.5 border border-[#272233]">
                    <GitBranch className="h-3 w-3 text-[#34d399]" />
                    <span className="text-[11px] font-mono text-[#f8fafc]">12 edges</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-[#161622] px-2.5 py-1.5 border border-[#272233]">
                    <AlertTriangle className="h-3 w-3 text-[#fbbf24]" />
                    <span className="text-[11px] font-mono text-[#f8fafc]">2 risks</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
