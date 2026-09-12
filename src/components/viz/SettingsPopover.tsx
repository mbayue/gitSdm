import { refreshChatConfig } from '@/stores/chatConfigStore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { useState, useRef, useEffect, useCallback, type ReactNode, type RefObject } from 'react';
import { Settings, X, Check, Eye, EyeOff, KeyRound, GitBranch, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MotionSettings } from './MotionSettings';
import { buttonVariants } from '@/components/ui/button-variants';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const GEMINI_KEY = 'gitsdm_gemini_api_key';
const PAT_KEY = 'gitsdm_github_pat';
const chatProviders = [['', 'Auto-detect'], ['gemini', 'Google Gemini'], ['openai', 'OpenAI-compatible'], ['anthropic', 'Anthropic']] as const;

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
  } catch {
    /* ignore */
  }
}

interface SettingsPopoverProps {
  triggerClassName?: string;
  triggerChildren?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  /** True opener element (e.g. the mobile Settings menu item). Takes
   *  precedence over the popover's own trigger refs on focus restore. */
  openerRef?: RefObject<HTMLElement | null>;
}

export function SettingsPopover({
  triggerClassName,
  triggerChildren,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  openerRef,
}: SettingsPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean | ((open: boolean) => boolean)) => {
      const resolved = typeof next === 'function' ? next(open) : next;
      if (controlledOpen === undefined) {
        setUncontrolledOpen(resolved);
      }
      onOpenChange?.(resolved);
    },
    [controlledOpen, onOpenChange, open],
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // True opener across every close path (X button, outside click, Escape).
  // openerRef tracks the actual element that opened the popover (the mobile
  // Settings menu item when hideTrigger); previousFocusRef is a snapshot of
  // the focused element at open time. The popover's own hidden trigger is
  // never a restore target.
  const previousFocusRef = useRef<HTMLElement | null>(null);

  function isVisibleFocusable(el: HTMLElement | null): el is HTMLElement {
    if (!el || !document.contains(el)) return false;
    if (el.classList.contains('sr-only')) return false;
    if ((el as HTMLButtonElement).disabled) return false;
    if (el.tabIndex < 0 && el.getAttribute('tabindex') === '-1') return false;
    return el.getClientRects().length > 0;
  }

  const restoreOpenerFocus = useCallback(() => {
    // Order matters: the true opener first, then the popover's own trigger,
    // then a visible workspace control. Every candidate is visibility-checked,
    // so a viewport crossing the lg breakpoint mid-session (desktop trigger
    // hidden, mobile trigger shown, or vice versa) still lands on something
    // visible instead of a hidden trigger or the document body.
    const trueOpener = openerRef?.current ?? null;
    if (isVisibleFocusable(trueOpener)) {
      trueOpener.focus();
      return;
    }
    const trigger = triggerRef.current;
    if (isVisibleFocusable(trigger)) {
      trigger.focus();
      return;
    }
    // No visible popover trigger (hideTrigger mode, or the breakpoint moved
    // under an open popover): fall back to the visible mobile menu trigger
    // rather than an invisible anchor.
    const menuTrigger = document.querySelector<HTMLElement>('button[aria-label="Open menu"]');
    if (menuTrigger && isVisibleFocusable(menuTrigger)) {
      menuTrigger.focus();
      return;
    }
    const previous = previousFocusRef.current;
    if (isVisibleFocusable(previous)) {
      previous.focus();
    }
  }, [openerRef]);

  const requestClose = useCallback(() => {
    setOpen(false);
    // Restore after the dialog unmounts so focus lands on a live element.
    queueMicrotask(restoreOpenerFocus);
  }, [restoreOpenerFocus, setOpen]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    popoverRef.current?.querySelector<HTMLElement>('[role="dialog"] input')?.focus();
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      // Scope to the dialog subtree and let the event bubble so global
      // Escape handling (workspace shortcuts, dropdowns, tooltips) still runs.
      if (!popoverRef.current?.contains(event.target as Node)) return;
      requestClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, requestClose]);

  // Gemini State
  const [geminiValue, setGeminiValue] = useState(() => getStoredKey(GEMINI_KEY) ?? '');
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  const [chatProvider, setChatProvider] = useState(() => getStoredKey('gitsdm_ai_provider') ?? '');
  const [chatModel, setChatModel] = useState(() => getStoredKey('gitsdm_ai_model') ?? '');
  const [chatBase, setChatBase] = useState(() => getStoredKey('gitsdm_ai_base_url') ?? '');

  // GitHub State
  const [patValue, setPatValue] = useState(() => getStoredKey(PAT_KEY) ?? '');
  const [patSaved, setPatSaved] = useState(false);
  const [showPat, setShowPat] = useState(false);

  const hasAnyKey = !!getStoredKey(GEMINI_KEY) || !!getStoredKey(PAT_KEY);

  // Close on click outside (restores opener focus like all close paths)
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && !providerMenuRef.current?.contains(e.target as Node)) {
        requestClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, requestClose]);

  const saveGemini = useCallback(() => {
    const trimmed = geminiValue.trim();
    setStoredKey(GEMINI_KEY, trimmed || null);
    setStoredKey('gitsdm_ai_provider', chatProvider || null);
    setStoredKey('gitsdm_ai_model', chatModel.trim() || null);
    setStoredKey('gitsdm_ai_base_url', chatProvider === 'openai' ? chatBase.trim() || null : null);
    refreshChatConfig();
    setGeminiSaved(true);
    setTimeout(() => setGeminiSaved(false), 1200);
  }, [geminiValue, chatProvider, chatModel, chatBase]);

  const clearGemini = useCallback(() => {
    setGeminiValue('');
    setChatProvider('');
    setChatModel('');
    setChatBase('');
    ['gitsdm_ai_provider', 'gitsdm_ai_model', 'gitsdm_ai_base_url'].forEach((key) => setStoredKey(key, null));
    setStoredKey(GEMINI_KEY, null);
    refreshChatConfig();
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
      {hideTrigger ? null : (
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
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-7 w-7 rounded-md p-0 border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-ring/50 transition-all duration-150 relative',
                    hasAnyKey && 'border-accent/30 text-accent bg-accent/10',
                  )
            }
            onClick={() => setOpen((o) => !o)}
          >
            {triggerChildren ?? (
              <>
                <Settings className={cn('h-3.5 w-3.5 transition-transform duration-300', open && 'rotate-45')} />
                {hasAnyKey && (
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                )}
              </>
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">Settings &amp; Credentials</TooltipContent>
        </Tooltip>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Settings and credentials"
          className="fixed left-2 right-2 top-14 w-auto sm:absolute sm:right-0 sm:left-auto sm:top-10 sm:w-80 z-[70] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-md border border-border bg-card p-4 shadow-2xl backdrop-blur-xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Credentials
            </span>
            <button
              type="button"
              aria-label="Close settings"
              onClick={requestClose}
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
                <span>AI API Key</span>
              </div>
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showGemini ? 'text' : 'password'}
                  aria-label="AI API key"
                  value={geminiValue}
                  onChange={(e) => setGeminiValue(e.target.value)}
                  placeholder="API key"
                  className="w-full rounded-md border border-border bg-background py-1.5 pl-3 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini((s) => !s)}
                  aria-label={showGemini ? 'Hide AI API key' : 'Show AI API key'}
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
                  aria-label={geminiSaved ? 'AI API key saved' : 'Save AI API key'}
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

          <div className="space-y-2 text-xs">
            <div className="space-y-2">
              <span className="font-medium text-foreground">Chat provider</span>
              <DropdownMenu>
                <DropdownMenuTrigger aria-label="Chat provider" className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent">
                  <span>{chatProviders.find(([value]) => value === chatProvider)?.[1] ?? 'Auto-detect'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent ref={providerMenuRef} align="start" sideOffset={4} className="z-[100] w-[var(--anchor-width)] border-border bg-card text-foreground">
                  <DropdownMenuRadioGroup value={chatProvider} onValueChange={setChatProvider}>
                    {chatProviders.map(([value, label]) => (
                      <DropdownMenuRadioItem key={value} value={value} className="text-xs">{label}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <label className="block space-y-1">
              <span>Chat model (optional)</span>
              <input
                aria-label="Chat model"
                value={chatModel}
                maxLength={200}
                onChange={(e) => setChatModel(e.target.value)}
                placeholder="Server default"
                className="w-full rounded-md border border-border bg-background p-2 text-foreground"
              />
            </label>
            {chatProvider === 'openai' && (
              <label className="block space-y-1">
                <span>Base URL (optional)</span>
                <input
                  aria-label="Chat base URL"
                  type="url"
                  value={chatBase}
                  onChange={(e) => setChatBase(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full rounded-md border border-border bg-background p-2 text-foreground"
                />
              </label>
            )}
            <p className="text-muted-foreground">
              Use Save beside the API key to apply these chat settings. Use a public HTTPS endpoint with your own API key. Embedding settings stay separate.
            </p>
          </div>

          {/* GitHub PAT Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-foreground text-xs font-medium">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                <span>GitHub PAT</span>
              </div>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&amp;description=gitSdm%20Token"
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
          <MotionSettings />
          <div className="border-t border-border pt-2 text-center text-xs text-muted-foreground">
            <p>
              Saved keys are stored in this browser and sent to the gitSdm backend for relevant requests. AI and search
              features may send repository content, including private code, to configured AI and embedding providers.
            </p>
            <p className="mt-2">
              Do not save keys on shared devices.{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2"
              >
                Privacy policy (opens in a new tab)
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
