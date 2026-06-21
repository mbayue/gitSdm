import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
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

interface SettingsPopoverProps {
  triggerClassName?: string;
  triggerChildren?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function SettingsPopover({
  triggerClassName,
  triggerChildren,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: SettingsPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback((next: boolean | ((open: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(open) : next;
    if (controlledOpen === undefined) {
      setUncontrolledOpen(resolved);
    }
    onOpenChange?.(resolved);
  }, [controlledOpen, onOpenChange, open]);
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
  }, [open, setOpen]);

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
      {!hideTrigger && (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={
              triggerClassName
                ? cn(triggerClassName, hasAnyKey && 'text-ui-active-text-green')
                : cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-7 w-7 rounded-md p-0 border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/[0.1] transition-all duration-150 relative",
                    hasAnyKey && 'border-[#58a6ff]/30 text-[#58a6ff] bg-[#58a6ff]/10'
                  )
            }
            onClick={() => setOpen((o) => !o)}
          >
            {triggerChildren ?? (
              <>
                <Settings className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-45")} />
                {hasAnyKey && (
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#58a6ff] animate-pulse" />
                )}
              </>
            )}
          </TooltipTrigger>
          <TooltipContent>Settings & Credentials</TooltipContent>
        </Tooltip>
      )}

      {open && (
        <div className="fixed left-2 right-2 top-14 w-auto sm:absolute sm:right-0 sm:left-auto sm:top-10 sm:w-80 z-[70] rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] p-4 shadow-2xl backdrop-blur-xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] pb-2">
            <span className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">Credentials</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Gemini API Key Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#e6edf3] text-xs font-medium">
                <KeyRound className="h-3.5 w-3.5 text-[#8b949e]" />
                <span>Google AI Key</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] hover:underline transition-colors"
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
                  className="w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-1.5 pl-3 pr-8 font-mono text-xs text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] transition-colors"
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
                    'flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors border',
                    geminiValue.trim()
                      ? 'bg-[#238636] text-white hover:bg-[#2ea043] border-[rgba(240,246,252,0.1)]'
                      : 'bg-[#0d1117] text-[#8b949e] border-[rgba(240,246,252,0.1)] cursor-not-allowed',
                  )}
                >
                  {geminiSaved ? <Check className="h-3.5 w-3.5 text-white" /> : 'Save'}
                </button>
                {getStoredKey(GEMINI_KEY) && (
                  <button
                    type="button"
                    onClick={clearGemini}
                    className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#1c2128] px-2 py-1.5 text-xs text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(240,246,252,0.1)] my-2" />

          {/* GitHub PAT Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#e6edf3] text-xs font-medium">
                <GitBranch className="h-3.5 w-3.5 text-[#8b949e]" />
                <span>GitHub PAT</span>
              </div>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=gitSdm%20Token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] hover:underline transition-colors"
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
                  className="w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-1.5 pl-3 pr-8 font-mono text-xs text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPat((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] transition-colors"
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
                    'flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors border',
                    patValue.trim()
                      ? 'bg-[#238636] text-white hover:bg-[#2ea043] border-[rgba(240,246,252,0.1)]'
                      : 'bg-[#0d1117] text-[#8b949e] border-[rgba(240,246,252,0.1)] cursor-not-allowed',
                  )}
                >
                  {patSaved ? <Check className="h-3.5 w-3.5 text-white" /> : 'Save'}
                </button>
                {getStoredKey(PAT_KEY) && (
                  <button
                    type="button"
                    onClick={clearPat}
                    className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#1c2128] px-2 py-1.5 text-xs text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-[rgba(240,246,252,0.1)] pt-2 text-center text-[10px] text-[#8b949e]">
            Keys are stored locally in your browser. Do not use shared devices.
          </div>
        </div>
      )}
    </div>
  );
}
