import { motion } from 'framer-motion';
import { Sparkles, Zap, GitBranch, Brain, Shield } from 'lucide-react';

const stats = [
  { value: '< 10s', label: 'To onboard new developers' },
  { value: 'AI', label: 'Roadmaps & mental models' },
  { value: '∞', label: 'Repository execution paths' },
];

const floatingNodes = [
  {
    icon: Brain,
    label: 'AI Roadmap: Ingestion Pipeline',
    accentClass: 'hero-node-violet',
    x: '-36vw', y: '-30px', delay: 0, duration: 5.5,
  },
  {
    icon: GitBranch,
    label: 'Execution Trace: server.ts → router.ts',
    accentClass: 'hero-node-cyan',
    x: '24vw', y: '-70px', delay: 1, duration: 6.5,
  },
  {
    icon: Shield,
    label: 'Smart Focus: API Layer only',
    accentClass: 'hero-node-emerald',
    x: '-30vw', y: '90px', delay: 2, duration: 7,
  },
  {
    icon: Zap,
    label: 'Architecture risks: 2',
    accentClass: 'hero-node-amber',
    x: '28vw', y: '70px', delay: 1.5, duration: 5.8,
  },
];



export function Hero() {
  return (
    <section className="relative pt-28 pb-12 text-center overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-80 w-[700px] -translate-x-1/2 rounded-full bg-violet-600/12 blur-[130px]" />
      <div className="absolute top-1/2 left-1/4 -z-10 h-48 w-[350px] rounded-full bg-cyan-500/6 blur-[90px]" />
      <div className="absolute top-1/3 right-1/4 -z-10 h-40 w-[280px] rounded-full bg-fuchsia-500/6 blur-[80px]" />

      {/* Floating nodes */}
      <div className="absolute inset-0 pointer-events-none hidden md:block select-none overflow-hidden">
        {floatingNodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={i}
              className={`absolute left-1/2 top-1/2 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-mono hero-node ${node.accentClass}`}
              style={{ x: node.x, y: node.y }}
              animate={{
                y: [parseFloat(node.y as string), parseFloat(node.y as string) - 16, parseFloat(node.y as string)],
                rotate: [0, 1.5, -1.5, 0],
              }}
              transition={{ duration: node.duration, repeat: Infinity, ease: 'easeInOut', delay: node.delay }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[160px]">{node.label}</span>
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-current animate-pulse" />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-4xl px-4 relative"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="hero-badge mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI-native repository onboarding intelligence</span>
          <span className="h-1 w-1 rounded-full bg-current animate-pulse" />
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl text-white leading-[1.1] mb-6">
          AI-Native Repository
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Onboarding Intelligence
          </span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Transform complex repositories into interactive learning paths. Instantly grasp mental models, trace execution pipelines, and master codebase structure in <span className="text-white font-medium">seconds</span>.
        </p>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center justify-center gap-8 sm:gap-12"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-white font-mono">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
