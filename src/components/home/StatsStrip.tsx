import { motion } from 'framer-motion';
import { Zap, Brain, Network, Shield } from 'lucide-react';

const stats = [
  { icon: Zap, value: '< 10s', label: 'Onboarding time', color: 'text-[#22d3ee]' },
  { icon: Brain, value: 'AI', label: 'Roadmap generation', color: 'text-[#8b5cf6]' },
  { icon: Network, value: '∞', label: 'Dependency mapping', color: 'text-[#34d399]' },
  { icon: Shield, value: 'Auto', label: 'Risk scanning', color: 'text-[#fbbf24]' },
];

export function StatsStrip() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-y border-[#272233] bg-[#0f0f17]/50 py-6"
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#161622] border border-[#272233]">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-[#f8fafc]">{s.value}</div>
                <div className="text-[11px] text-[#a1a1aa]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
