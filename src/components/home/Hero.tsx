import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-28 pb-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-3xl px-4"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 hero-badge">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered codebase intelligence
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Understand any{' '}
          <span className="gradient-text">GitHub repo</span>
          <br />
          in seconds
        </h1>
        <p className="mt-6 text-lg text-zinc-400">
          Paste a repository URL. Get interactive dependency graphs, architecture insights,
          and AI explanations — built for developers who move fast.
        </p>
      </motion.div>
    </section>
  );
}
