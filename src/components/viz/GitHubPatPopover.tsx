import { useState, useRef, useEffect, useCallback } from 'react';
import { Github, X, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function GitHubPatPopover() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => getStoredPat() ?? '');
  const [saved, setSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasToken = !!getStoredPat();

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSave = useCallback(() => {
    const trimmed = value.trim();
    setStoredPat(trimmed || null);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1200);
  }, [value]);

  const handleClear = useCallback(() => {
    setValue('');
    setStoredPat(null);
    setSaved(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setOpen(false);
  }, [handleSave]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Set GitHub PAT for private repos"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]',
          hasToken
            ? 'border-indigo-500/40 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20'
            : 'border-white/10 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white',
        )}
      >
        <Github className="h-3.5 w-3.5" />
        {hasToken && (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <Github className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-white">GitHub PAT</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3 space-y-3">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Enter a{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=gitSdm%20Token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline"
              >
                GitHub Personal Access Token
              </a>{' '}
              with <code className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded font-mono">repo</code> scope to analyze private repositories. Stored locally only.
            </p>

            {/* Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type={showToken ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="github_pat_... or ghp_..."
                className="w-full rounded-lg border border-white/10 bg-zinc-800 py-1.5 pl-3 pr-8 font-mono text-xs text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!value.trim()}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all',
                  value.trim()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
                )}
              >
                {saved ? (
                  <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Saved!</span></>
                ) : (
                  'Save Token'
                )}
              </button>
              {getStoredPat() && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
