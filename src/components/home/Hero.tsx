import { motion } from 'framer-motion';
import { Sparkles, FileCode, Folder, ShieldAlert, GitPullRequest } from 'lucide-react';

export function Hero() {
  const floatingNodes = [
    {
      icon: FileCode,
      label: 'src/main.tsx',
      color: 'border-violet-500/30 dark:text-violet-300 text-violet-600 dark:bg-violet-500/5 bg-violet-500/10',
      x: '-25vw',
      y: '-20px',
      delay: 0,
      duration: 5,
    },
    {
      icon: Folder,
      label: 'src/features/graph',
      color: 'border-cyan-500/30 dark:text-cyan-300 text-cyan-600 dark:bg-cyan-500/5 bg-cyan-500/10',
      x: '22vw',
      y: '-80px',
      delay: 1,
      duration: 6,
    },
    {
      icon: ShieldAlert,
      label: 'health-check.ts',
      color: 'border-emerald-500/30 dark:text-emerald-300 text-emerald-600 dark:bg-emerald-500/5 bg-emerald-500/10',
      x: '-28vw',
      y: '100px',
      delay: 2,
      duration: 7,
    },
    {
      icon: GitPullRequest,
      label: 'api-router.ts',
      color: 'border-pink-500/30 dark:text-pink-300 text-pink-600 dark:bg-pink-500/5 bg-pink-500/10',
      x: '26vw',
      y: '80px',
      delay: 1.5,
      duration: 5.5,
    },
  ];

  return (
    <section className="relative pt-32 pb-16 text-center overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="absolute top-1/3 left-1/3 -z-10 h-48 w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[80px]" />

      {/* Floating Interactive Code Nodes */}
      <div className="absolute inset-0 pointer-events-none hidden md:block select-none overflow-hidden">
        {floatingNodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={i}
              className={`absolute left-1/2 top-1/2 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-mono shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md ${node.color}`}
              style={{ x: node.x, y: node.y }}
              animate={{
                y: [parseFloat(node.y), parseFloat(node.y) - 15, parseFloat(node.y)],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: node.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: node.delay,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{node.label}</span>
              <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl px-4 relative"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-300 hero-badge"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span>JuaraVibeCoding Edition — AI-powered codebase intelligence</span>
        </motion.div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white leading-[1.15]">
          Understand any{' '}
          <span className="gradient-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            GitHub Repo
          </span>
          <br />
          in cinematic detail
        </h1>

        <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Paste a repository link to build interactive dependency graphs, compute modular health scores,
          generate Mermaid charts, and get AI-driven structural walk-throughs in seconds.
        </p>
      </motion.div>
    </section>
  );
}
