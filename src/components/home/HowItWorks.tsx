import { motion } from 'framer-motion';
import { GitBranch, Zap, Network, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';

const steps = [
  {
    icon: GitBranch,
    step: '01',
    title: 'Paste repo',
    description: 'Enter any GitHub repository URL or owner/repo shorthand.',
    color: 'text-[#8b5cf6]',
    bg: 'bg-[#8b5cf6]/10',
    border: 'border-[#8b5cf6]/20',
  },
  {
    icon: Zap,
    step: '02',
    title: 'Analyze',
    description: 'AI scans structure, dependencies, and architecture in under 10 seconds.',
    color: 'text-[#22d3ee]',
    bg: 'bg-[#22d3ee]/10',
    border: 'border-[#22d3ee]/20',
  },
  {
    icon: Network,
    step: '03',
    title: 'Explore graph',
    description: 'Navigate the interactive dependency graph. Click nodes to deep-dive.',
    color: 'text-[#34d399]',
    bg: 'bg-[#34d399]/10',
    border: 'border-[#34d399]/20',
  },
  {
    icon: Brain,
    step: '04',
    title: 'Ask AI',
    description: 'Get explanations, onboarding guides, and architecture insights instantly.',
    color: 'text-[#fbbf24]',
    bg: 'bg-[#fbbf24]/10',
    border: 'border-[#fbbf24]/20',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-[#8b5cf6] mb-3 block">How it works</span>
        <h2 className="text-3xl font-bold text-[#f8fafc] sm:text-4xl">
          Four steps to mastery
        </h2>
        <p className="mt-3 text-[#a1a1aa] max-w-md mx-auto">
          From URL to full understanding in under a minute.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="h-full p-5 border-[#272233] bg-[#0f0f17] hover:border-[#272233]/80 hover:-translate-y-0.5 transition-all cursor-default">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg} border ${s.border} mb-4`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]/50 mb-1.5">{s.step}</div>
              <h3 className="text-sm font-semibold text-[#f8fafc] mb-1.5">{s.title}</h3>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">{s.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
