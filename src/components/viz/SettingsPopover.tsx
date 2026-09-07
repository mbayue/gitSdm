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
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    popoverRef.current?.querySelector<HTMLElement>('[role="dialog"] input')?.focus();
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      if (triggerRef.current) triggerRef.current.focus();
      else if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [open, setOpen]);

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
            ref={triggerRef}
            type="button"
            aria-label="Settings and credentials"
            aria-expanded={open}
            aria-haspopup="dialog"
            className={
              triggerClassName
                ? cn(triggerClassName, hasAnyKey && 'text-ui-active-text-green')
                : cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-7 w-7 rounded-md p-0 border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-ring/50 transition-all duration-150 relative",
                    hasAnyKey && 'border-accent/30 text-accent bg-accent/10'
                  )
            }
            onClick={() => setOpen((o) => !o)}
          >
            {triggerChildren ?? (
              <>
                <Settings className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-45")} />
                {hasAnyKey && (
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                )}
              </>
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">Settings & Credentials</TooltipContent>
        </Tooltip>
      )}

      {open && (
        <div role="dialog" aria-label="Settings and credentials" className="fixed left-2 right-2 top-14 w-auto sm:absolute sm:right-0 sm:left-auto sm:top-10 sm:w-80 z-[70] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-md border border-border bg-card p-4 shadow-2xl backdrop-blur-xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Credentials</span>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Gemini API Key Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-foreground text-xs font-medium">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Google AI Key</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:text-accent hover:underline transition-colors"
              >
                Get Key
              </a>
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showGemini ? 'text' : 'password'}
                  aria-label="Google AI key"
                  value={geminiValue}
                  onChange={(e) => setGeminiValue(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-md border border-border bg-background py-1.5 pl-3 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini((s) => !s)}
                  aria-label={showGemini ? 'Hide Google AI key' : 'Show Google AI key'}
                  aria-pressed={showGemini}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showGemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={saveGemini}
                  aria-label={geminiSaved ? 'Google AI key saved' : 'Save Google AI key'}
                  disabled={!geminiValue.trim()}
                  className={cn(
                    'flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors border',
                    geminiValue.trim()
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-border'
                      : 'bg-background text-muted-foreground border-border cursor-not-allowed',
                  )}
                >
                  {geminiSaved ? <Check className="h-3.5 w-3.5 text-primary-foreground" /> : 'Save'}
                </button>
                {getStoredKey(GEMINI_KEY) && (
                  <button
                    type="button"
                    onClick={clearGemini}
                    className="rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border my-2" />

          {/* GitHub PAT Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-foreground text-xs font-medium">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                <span>GitHub PAT</span>
              </div>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=gitSdm%20Token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:text-accent hover:underline transition-colors"
              >
                Create PAT
              </a>
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPat ? 'text' : 'password'}
                  aria-label="GitHub personal access token"
                  value={patValue}
                  onChange={(e) => setPatValue(e.target.value)}
                  placeholder="github_pat_..."
                  className="w-full rounded-md border border-border bg-background py-1.5 pl-3 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPat((s) => !s)}
                  aria-label={showPat ? 'Hide GitHub token' : 'Show GitHub token'}
                  aria-pressed={showPat}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPat ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={savePat}
                  aria-label={patSaved ? 'GitHub token saved' : 'Save GitHub token'}
                  disabled={!patValue.trim()}
                  className={cn(
                    'flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors border',
                    patValue.trim()
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-border'
                      : 'bg-background text-muted-foreground border-border cursor-not-allowed',
                  )}
                >
                  {patSaved ? <Check className="h-3.5 w-3.5 text-primary-foreground" /> : 'Save'}
                </button>
                {getStoredKey(PAT_KEY) && (
                  <button
                    type="button"
                    onClick={clearPat}
                    className="rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-border pt-2 text-center text-xs text-muted-foreground">
            Keys are stored locally in your browser. Do not use shared devices.
          </div>
        </div>
      )}
    </div>
  );
}
