import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Zap } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { getVisibleRepoPresets } from '@/components/home/repo-presets';
import { fetchAppConfig } from '@/lib/api-client';
import { parseRepoFromUrl, LAST_REPO_KEY } from '@/lib/utils';

interface RepoInputProps {
  initialUrl?: string;
}

export { REPO_PRESETS as PRESETS } from '@/components/home/repo-presets';


export function RepoInput({ initialUrl = '' }: RepoInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMockPresets, setShowMockPresets] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    fetchAppConfig()
      .then((config) => {
        if (!ignore) setShowMockPresets(config.aiProvider === 'mock');
      })
      .catch(() => {
        if (!ignore) setShowMockPresets(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const presets = useMemo(
    () => getVisibleRepoPresets(showMockPresets),
    [showMockPresets],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseRepoFromUrl(url);
    if (!parsed) {
      setError('Enter a valid GitHub URL or owner/repo (e.g. facebook/react)');
      return;
    }

    localStorage.setItem(LAST_REPO_KEY, url);
    setLoading(true);

    try {
      navigate(`/${parsed.owner}/${parsed.repo}`, {
        state: { pendingUrl: url },
      });
    } catch {
      setError('Failed to navigate');
      setLoading(false);
    }
  };

  const handlePreset = (repo: string) => {
    setUrl(`https://github.com/${repo}`);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      id="analyze"
      className="mx-auto max-w-2xl scroll-mt-20 px-4"
    >
      <GlassCard className="p-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo  or  owner/repo"
              className="pl-10"
              disabled={loading}
            />
          </div>
          <GlowButton type="submit" loading={loading} className="sm:shrink-0">
            <Zap className="h-4 w-4" />
            Analyze
            <ArrowRight className="h-4 w-4" />
          </GlowButton>
        </form>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}

        {/* Preset pills */}
        <div className="mt-3 border-t border-white/5 pt-3 px-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="repo-preset-try text-[10px] font-semibold uppercase tracking-wider mr-1">TRY:</span>
            {presets.map((item) => (
              <button
                key={item.repo}
                type="button"
                onClick={() => handlePreset(item.repo)}
                title={item.repo}
                className="repo-preset-pill group flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all duration-150 font-medium"
              >
                <span className="repo-preset-label">{item.label}</span>
                <span className="repo-preset-desc text-[9px] font-mono transition-colors">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
