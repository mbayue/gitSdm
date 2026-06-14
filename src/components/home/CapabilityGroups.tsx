import { motion } from 'framer-motion';
import {
  Brain,
  GitBranch,
  FolderTree,
  Package,
  Users,
  Flame,
  Map,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const groups = [
  {
    title: 'Understand',
    description: 'See the big picture instantly',
    badge: 'Core',
    badgeColor: 'border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]',
    features: [
      {
        icon: GitBranch,
        title: 'Interactive Architecture Graph',
        description: 'Explore folder structure, files, and module dependencies in an animated canvas.',
        color: 'text-[#8b5cf6]',
        bg: 'bg-[#8b5cf6]/10',
        border: 'border-[#8b5cf6]/20',
      },
      {
        icon: Map,
        title: 'Architecture Layer Mapping',
        description: 'Automatically identify API, services, UI, data layers with file references.',
        color: 'text-[#a78bfa]',
        bg: 'bg-[#a78bfa]/10',
        border: 'border-[#a78bfa]/20',
      },
      {
        icon: Package,
        title: 'Multi-Ecosystem Dependencies',
        description: 'Parse npm, pip, Cargo, Go modules, Maven. Visualize across ecosystems.',
        color: 'text-[#22d3ee]',
        bg: 'bg-[#22d3ee]/10',
        border: 'border-[#22d3ee]/20',
      },
    ],
  },
  {
    title: 'Learn',
    description: 'Get up to speed fast',
    badge: 'AI',
    badgeColor: 'border-[#22d3ee]/30 bg-[#22d3ee]/10 text-[#67e8f9]',
    features: [
      {
        icon: Brain,
        title: 'AI Repository Intelligence',
        description: 'Senior-engineer explanations: what it does, how modules interact, where to start.',
        color: 'text-[#22d3ee]',
        bg: 'bg-[#22d3ee]/10',
        border: 'border-[#22d3ee]/20',
      },
      {
        icon: FolderTree,
        title: 'Smart Onboarding Guide',
        description: 'Step-by-step walkthrough: entry points, request lifecycle, key modules.',
        color: 'text-[#34d399]',
        bg: 'bg-[#34d399]/10',
        border: 'border-[#34d399]/20',
      },
      {
        icon: Users,
        title: 'Contributor & Activity Timeline',
        description: 'Visualize top contributors and 90-day commit activity for project context.',
        color: 'text-[#a78bfa]',
        bg: 'bg-[#a78bfa]/10',
        border: 'border-[#a78bfa]/20',
      },
    ],
  },
  {
    title: 'Improve',
    description: 'Find what needs fixing',
    badge: 'Pro',
    badgeColor: 'border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]',
    features: [
      {
        icon: Shield,
        title: 'Codebase Health Scores',
        description: 'Quantify maintainability, modularity, readability. Spot refactor opportunities.',
        color: 'text-[#fbbf24]',
        bg: 'bg-[#fbbf24]/10',
        border: 'border-[#fbbf24]/20',
      },
      {
        icon: Flame,
        title: 'Repo Roast Mode',
        description: 'Witty, specific roast from an AI senior engineer. Funny and insightful.',
        color: 'text-[#f87171]',
        bg: 'bg-[#f87171]/10',
        border: 'border-[#f87171]/20',
      },
      {
        icon: AlertTriangle,
        title: 'Architecture Risk Detection',
        description: 'Identify circular dependencies, god modules, and tight coupling automatically.',
        color: 'text-[#34d399]',
        bg: 'bg-[#34d399]/10',
        border: 'border-[#34d399]/20',
      },
    ],
  },
];

export function CapabilityGroups() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-[#8b5cf6] mb-3 block">Platform Capabilities</span>
        <h2 className="text-3xl font-bold text-[#f8fafc] sm:text-4xl">
          Everything you need to master any codebase
        </h2>
        <p className="mt-3 text-[#a1a1aa] max-w-lg mx-auto">
          From graph visualization to AI architecture analysis — built for developer velocity.
        </p>
      </motion.div>

      <div className="space-y-12">
        {groups.map((group, gi) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: gi * 0.1, duration: 0.5 }}
          >
            {/* Group header */}
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-lg font-bold text-[#f8fafc]">{group.title}</h3>
              <Badge variant="secondary" className={`text-[10px] ${group.badgeColor}`}>
                {group.badge}
              </Badge>
              <span className="text-xs text-[#a1a1aa]">— {group.description}</span>
            </div>

            {/* Feature cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (gi * 3 + i) * 0.05, duration: 0.4 }}
                >
                  <Card className="h-full p-5 border-[#272233] bg-[#0f0f17] hover:border-[#272233]/80 hover:-translate-y-0.5 transition-all group cursor-default">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${f.bg} border ${f.border} mb-3 group-hover:scale-105 transition-transform`}>
                      <f.icon className={`h-4 w-4 ${f.color}`} />
                    </div>
                    <h4 className="text-sm font-semibold text-[#f8fafc] mb-1.5">{f.title}</h4>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">{f.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
