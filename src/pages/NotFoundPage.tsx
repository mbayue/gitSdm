import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 flex items-center justify-center p-4">
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/5 bg-zinc-900/40 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl text-center"
      >
        {/* Shine Overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* 404 Visual */}
        <div className="relative inline-block mb-4">
          <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl bg-indigo-500/30 -z-10" />
        </div>

        {/* Messaging */}
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          The requested address doesn't exist or has moved. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium shadow-lg shadow-indigo-500/15 transition-all duration-200 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Navigate Home
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 font-medium transition-all duration-200 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-white/5 text-xs text-zinc-500">
          gitSdm Visualizer Router
        </div>
      </motion.div>
    </div>
  );
}
