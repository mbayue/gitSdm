import { motion } from 'framer-motion';
import {
  Brain,
  Clock,
  FolderTree,
  GitBranch,
  Package,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const features = [
  {
    icon: GitBranch,
    title: 'Interactive graphs',
    description: 'Explore folder structure, files, and dependencies in a React Flow canvas.',
  },
  {
    icon: Brain,
    title: 'AI explanations',
    description: 'Get instant summaries and architecture overviews',
  },
  {
    icon: FolderTree,
    title: 'Smart explorer',
    description: 'Navigate with badges for entry points, configs, tests, and key files.',
  },
  {
    icon: Package,
    title: 'Dependency analysis',
    description: 'Parse package.json, Cargo.toml, go.mod, and more across ecosystems.',
  },
  {
    icon: Users,
    title: 'Contributors',
    description: 'Visualize top contributors alongside your repository graph.',
  },
  {
    icon: Clock,
    title: 'Timeline',
    description: 'See commit activity over the last 90 days at a glance.',
  },
];

export function FeatureShowcase() {
  return (
    <section id="docs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <h2 className="mb-12 text-center text-2xl font-semibold text-white">
        Built for instant understanding
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <GlassCard hover className="h-full">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/30 to-cyan-500/20 logo-icon feature-icon">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{f.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
