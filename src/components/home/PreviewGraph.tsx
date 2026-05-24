import { motion } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { GraphCanvas } from '@/features/graph/GraphCanvas';
import { demoGraph } from '@/features/graph/demo-graph';
import { GlassCard } from '@/components/ui/GlassCard';

export function PreviewGraph() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-5xl px-4 py-16"
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-white">Live preview</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Interactive dependency graph — zoom, pan, and explore
        </p>
      </div>
      <GlassCard className="overflow-hidden p-0">
        <div className="h-[320px] w-full">
          <ReactFlowProvider>
            <GraphCanvas graph={demoGraph} readOnly />
          </ReactFlowProvider>
        </div>
      </GlassCard>
    </motion.section>
  );
}
