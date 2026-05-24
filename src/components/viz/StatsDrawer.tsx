import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { RepoAnalysis } from '@/types';
import ContributorList from '@/components/contributors/ContributorList';
import { RepoTimeline } from '@/components/timeline/RepoTimeline';
import { useVizStore } from '@/stores/viz-store';

interface StatsDrawerProps {
  analysis: RepoAnalysis;
}

export function StatsDrawer({ analysis }: StatsDrawerProps) {
  const { drawerOpen, setDrawerOpen } = useVizStore();

  return (
    <div className="shrink-0 border-t border-white/5 bg-zinc-950/80">
      <button
        type="button"
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="flex w-full items-center justify-center gap-1 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300"
      >
        {drawerOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        {drawerOpen ? 'Hide' : 'Show'} contributors & activity
      </button>
      {drawerOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="grid gap-4 border-t border-white/[0.04] p-4 md:grid-cols-2"
        >
          <div className="max-h-80 overflow-auto pr-2">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              Contributors
            </h3>
            <ContributorList contributors={analysis.contributors} />
          </div>
          <div>
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              Activity
            </h3>
            <RepoTimeline timeline={analysis.timeline} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
