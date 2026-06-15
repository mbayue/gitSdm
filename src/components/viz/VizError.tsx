import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, Lock, Wifi, ArrowLeft, RefreshCw, GitBranch, Check, Eye, EyeOff } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';

const LS_KEY = 'gitsdm_github_pat';

function getStoredPat(): string | null {
  try {
    return localStorage.getItem(LS_KEY) || null;
  } catch {
    return null;
  }
}

function setStoredPat(token: string | null) {
  try {
    if (token) localStorage.setItem(LS_KEY, token);
    else localStorage.removeItem(LS_KEY);
  } catch { /* ignore */ }
}


interface VizErrorProps {
  error?: string | { error?: string; message?: string; code?: string };
  message?: string;
}

function getErrorMeta(errStr: string, code?: string): {
  icon: typeof AlertCircle;
  title: string;
  tip: string;
  color: string;
  borderColor: string;
} {
  const lower = errStr.toLowerCase();
  const isPrivate = code === 'REPO_INACCESSIBLE' || lower.includes('private') || lower.includes('not found') || lower.includes('404');
  const isRate = code === 'RATE_LIMIT_EXCEEDED' || lower.includes('rate limit') || lower.includes('429');
  const isNetwork = lower.includes('network') || lower.includes('fetch') || lower.includes('connect');

  if (isPrivate) {
    return {
      icon: Lock,
      title: 'Repository Inaccessible',
      tip: "This repository is private or doesn't exist. gitSdm works with public repositories only.",
      color: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    };
  }
  if (isRate) {
    return {
      icon: RefreshCw,
      title: 'GitHub Rate Limit',
      tip: "GitHub's API rate limit was exceeded. Wait a minute and try again.",
      color: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    };
  }
  if (isNetwork) {
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

export function VizError({ error, message }: VizErrorProps) {
  let errStr = message || 'An unexpected analysis error occurred';
  let errCode = '';

  if (error) {
    if (typeof error === 'string') {
      errStr = error;
    } else {
      errStr = error.error || error.message || errStr;
      errCode = error.code || '';
    }
  }

  const meta = getErrorMeta(errStr, errCode);
  const Icon = meta.icon;

  const [tokenValue, setTokenValue] = useState(() => getStoredPat() ?? '');
  const [saved, setSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const isPrivateError = errCode === 'REPO_INACCESSIBLE' || 
                         errStr.toLowerCase().includes('private') || 
                         errStr.toLowerCase().includes('not found') || 
                         errStr.toLowerCase().includes('404');
  
  const hasPat = !!getStoredPat();
  const tipText = isPrivateError
    ? hasPat
      ? 'This repository is private or does not exist. The saved Personal Access Token might not have sufficient permissions.'
      : 'This repository is private or does not exist. Configure a GitHub Personal Access Token (PAT) below to access it.'
    : meta.tip;

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
        <p className="text-sm text-zinc-400 leading-relaxed mb-2">{tipText}</p>

        {/* Raw error in a subtle code block */}
        <div className="mt-4 rounded-lg bg-zinc-800/60 border border-white/5 p-3 text-left">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Error details</span>
          <p className="text-xs text-zinc-500 font-mono leading-relaxed break-words">{errStr}</p>
        </div>

        {isPrivateError && (
          <div className="mt-6 rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/10 to-zinc-950/40 p-5 text-left shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <GitBranch className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-white">Access Private Repository</span>
            </div>
            
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
              Add a{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=gitSdm%20Token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                GitHub Personal Access Token (PAT)
              </a>{' '}
              with <code className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded font-mono">repo</code> scope.
            </p>

            <div className="relative mb-3">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                placeholder="github_pat_... or ghp_..."
                className="w-full rounded-lg border border-white/10 bg-zinc-900/60 py-2 pl-3 pr-8 font-mono text-xs text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const trimmed = tokenValue.trim();
                  setStoredPat(trimmed || null);
                  setSaved(true);
                  setTimeout(() => {
                    setSaved(false);
                    window.location.reload();
                  }, 800);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  tokenValue.trim()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-[0.98]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
                disabled={!tokenValue.trim()}
              >
                {saved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400 animate-pulse" />
                    <span className="text-green-400">Token Saved!</span>
                  </>
                ) : (
                  'Save & Retry'
                )}
              </button>
              {getStoredPat() && (
                <button
                  type="button"
                  onClick={() => {
                    setTokenValue('');
                    setStoredPat(null);
                  }}
                  className="rounded-lg border border-white/10 bg-zinc-800/80 px-3.5 py-2 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all active:scale-[0.98]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/">
            <GlowButton variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </GlowButton>
          </Link>
          {!isPrivateError && (
            <GlowButton onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </GlowButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}

