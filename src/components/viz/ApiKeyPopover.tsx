import { useState, useRef, useEffect, useCallback } from 'react';
import { KeyRound, X, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const LS_KEY = 'gitsdm_gemini_api_key';

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(LS_KEY) || null;
  } catch {
    return null;
  }
}

function setStoredApiKey(key: string | null) {
  try {
    if (key) localStorage.setItem(LS_KEY, key);
    else localStorage.removeItem(LS_KEY);
  } catch { }
}

export function ApiKeyPopover() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => getStoredApiKey() ?? '');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasKey = !!getStoredApiKey();

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
    setStoredApiKey(trimmed || null);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1200);
  }, [value]);

  const handleClear = useCallback(() => {
    setValue('');
    setStoredApiKey(null);
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
        title="Set AI API key"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]',
          hasKey
            ? 'border-violet-500/40 bg-violet-600/10 text-violet-400 hover:bg-violet-600/20'
            : 'border-white/10 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white',
        )}
      >
        <KeyRound className="h-3.5 w-3.5" />
        {hasKey && (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-white">AI API Key</span>
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
              Enter your{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline"
              >
                Google AI Studio
              </a>{' '}
              key to enable AI features. Stored locally in your browser only.
            </p>

            {/* Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type={showKey ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="AIzaSy... / sk-... / sk-ant-..."
                className="w-full rounded-lg border border-white/10 bg-zinc-800 py-1.5 pl-3 pr-8 font-mono text-xs text-white placeholder-zinc-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
                    ? 'bg-violet-600 text-white hover:bg-violet-500'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
                )}
              >
                {saved ? (
                  <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Saved!</span></>
                ) : (
                  'Save Key'
                )}
              </button>
              {getStoredApiKey() && (
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
