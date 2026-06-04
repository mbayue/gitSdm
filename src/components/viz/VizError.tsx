import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, Lock, Wifi, ArrowLeft, RefreshCw } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';

interface VizErrorProps {
  message: string;
}

function getErrorMeta(message: string): {
  icon: typeof AlertCircle;
  title: string;
  tip: string;
  color: string;
  borderColor: string;
} {
  const lower = message.toLowerCase();

  if (lower.includes('private') || lower.includes('not found') || lower.includes('404')) {
    return {
      icon: Lock,
      title: 'Repository Inaccessible',
      tip: 'This repository is private or doesn\'t exist. gitSdm works with public repositories only.',
      color: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    };
  }
  if (lower.includes('rate limit') || lower.includes('429')) {
    return {
      icon: RefreshCw,
      title: 'GitHub Rate Limit',
      tip: 'GitHub\'s API rate limit was exceeded. Wait a minute and try again.',
      color: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    };
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('connect')) {
    return {
      icon: Wifi,
      title: 'Connection Error',
      tip: 'Could not reach GitHub API. Check your connection and try again.',
      color: 'text-rose-400',
      borderColor: 'border-rose-500/20',
    };
  }
  return {
    icon: AlertCircle,
    title: 'Analysis Failed',
    tip: 'Something went wrong. Try a different repository or refresh the page.',
    color: 'text-red-400',
    borderColor: 'border-red-500/20',
  };
}

export function VizError({ message }: VizErrorProps) {
  const meta = getErrorMeta(message);
  const Icon = meta.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-96 w-96 rounded-full bg-red-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-md rounded-2xl border ${meta.borderColor} bg-zinc-900/60 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl text-center`}
      >
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 border border-white/5`}>
          <Icon className={`h-8 w-8 ${meta.color}`} />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{meta.title}</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-2">{meta.tip}</p>

        {/* Raw error in a subtle code block */}
        <div className="mt-4 rounded-lg bg-zinc-800/60 border border-white/5 p-3 text-left">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Error details</span>
          <p className="text-xs text-zinc-500 font-mono leading-relaxed break-words">{message}</p>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/">
            <GlowButton variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </GlowButton>
          </Link>
          <GlowButton onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </GlowButton>
        </div>

        {/* Offline suggestion */}
        <div className="mt-6 border-t border-white/5 pt-4 text-center">
          <p className="text-xs text-zinc-400 mb-3">
            Setup GITHUB_TOKEN in .env or run locally with a mock repository:
          </p>
          <div className="flex gap-2 justify-center">
            <Link to="/mock/todo-app">
              <GlowButton variant="ghost" className="text-xs px-3 py-1.5 gap-1.5 h-8">
                <span>📦</span> Todo App (Mock)
              </GlowButton>
            </Link>
            <Link to="/mock/gitsdm">
              <GlowButton variant="ghost" className="text-xs px-3 py-1.5 gap-1.5 h-8">
                <span>🔮</span> gitSdm (Mock)
              </GlowButton>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

