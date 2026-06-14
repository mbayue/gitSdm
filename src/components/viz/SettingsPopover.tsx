import { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, X, Check, Eye, EyeOff, KeyRound, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const GEMINI_KEY = 'gitsdm_gemini_api_key';
const PAT_KEY = 'gitsdm_github_pat';

function getStoredKey(key: string): string | null {
  try {
    return localStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

function setStoredKey(key: string, val: string | null) {
  try {
    if (val) localStorage.setItem(key, val);
    else localStorage.removeItem(key);
  } catch { /* ignore */ }
}

export function SettingsPopover() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Gemini State
  const [geminiValue, setGeminiValue] = useState(() => getStoredKey(GEMINI_KEY) ?? '');
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  // GitHub State
  const [patValue, setPatValue] = useState(() => getStoredKey(PAT_KEY) ?? '');
  const [patSaved, setPatSaved] = useState(false);
  const [showPat, setShowPat] = useState(false);

  const hasAnyKey = !!getStoredKey(GEMINI_KEY) || !!getStoredKey(PAT_KEY);

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

  const saveGemini = useCallback(() => {
    const trimmed = geminiValue.trim();
    setStoredKey(GEMINI_KEY, trimmed || null);
    setGeminiSaved(true);
    setTimeout(() => setGeminiSaved(false), 1200);
  }, [geminiValue]);

  const clearGemini = useCallback(() => {
    setGeminiValue('');
    setStoredKey(GEMINI_KEY, null);
    setGeminiSaved(false);
  }, []);

  const savePat = useCallback(() => {
    const trimmed = patValue.trim();
    setStoredKey(PAT_KEY, trimmed || null);
    setPatSaved(true);
    setTimeout(() => setPatSaved(false), 1200);
  }, [patValue]);

  const clearPat = useCallback(() => {
    setPatValue('');
    setStoredKey(PAT_KEY, null);
    setPatSaved(false);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-7 w-7 rounded-md p-0 border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/[0.1] transition-all duration-150 relative",
            hasAnyKey && 'border-violet-500/30 text-violet-400 bg-violet-550/[0.02]'
          )}
          onClick={() => setOpen((o) => !o)}
        >
          <Settings className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-45")} />
          {hasAnyKey && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          )}
        </TooltipTrigger>
        <TooltipContent>Settings &amp; Credentials</TooltipContent>
      </Tooltip>

      {open && (
        <div className="fixed left-2 right-2 top-14 w-auto sm:absolute sm:right-0 sm:left-auto sm:top-10 sm:w-80 z-[70] rounded-xl border border-white/10 bg-zinc-950 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-semibold text-white tracking-wider uppercase">Credentials</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Gemini API Key Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                <KeyRound className="h-3.5 w-3.5 text-violet-400" />
                <span>Google AI Key</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-violet-400 hover:underline"
              >
                Get Key
              </a>
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={geminiValue}
                  onChange={(e) => setGeminiValue(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 py-1.5 pl-3 pr-8 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showGemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={saveGemini}
                  disabled={!geminiValue.trim()}
                  className={cn(
                    'flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border border-transparent',
                    geminiValue.trim()
                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                      : 'bg-zinc-900 text-zinc-650 border-white/5 cursor-not-allowed',
                  )}
                >
                  {geminiSaved ? <Check className="h-3.5 w-3.5 text-green-400" /> : 'Save'}
                </button>
                {getStoredKey(GEMINI_KEY) && (
                  <button
                    type="button"
                    onClick={clearGemini}
                    className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 my-2" />

          {/* GitHub PAT Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
                <span>GitHub PAT</span>
              </div>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=gitSdm%20Token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-indigo-400 hover:underline"
              >
                Create PAT
              </a>
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPat ? 'text' : 'password'}
                  value={patValue}
                  onChange={(e) => setPatValue(e.target.value)}
                  placeholder="github_pat_..."
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 py-1.5 pl-3 pr-8 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPat((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPat ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={savePat}
                  disabled={!patValue.trim()}
                  className={cn(
                    'flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border border-transparent',
                    patValue.trim()
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                      : 'bg-zinc-900 text-zinc-650 border-white/5 cursor-not-allowed',
                  )}
                >
                  {patSaved ? <Check className="h-3.5 w-3.5 text-green-400" /> : 'Save'}
                </button>
                {getStoredKey(PAT_KEY) && (
                  <button
                    type="button"
                    onClick={clearPat}
                    className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-white/5 pt-2 text-center text-[10px] text-zinc-500">
            Stored locally in your browser storage only.
          </div>
        </div>
      )}
    </div>
  );
}
