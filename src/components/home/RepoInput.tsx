import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVisibleRepoPresets } from '@/components/home/repoPresets';
import { fetchAppConfig } from '@/lib/apiClient';
import { parseRepoFromUrl, LAST_REPO_KEY } from '@/lib/utils';

interface RepoInputProps {
  initialUrl?: string;
}

export { REPO_PRESETS as PRESETS } from '@/components/home/repoPresets';

export function RepoInput({ initialUrl = '' }: RepoInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { data: config } = useQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAppConfig,
    staleTime: 1000 * 60 * 60,
  });

  const showMockPresets = config?.aiProvider === 'mock';

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
    <div className="w-full max-w-2xl scroll-mt-20 px-0">
      <div className="flex flex-col gap-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center w-full">
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="github.com/owner/repo"
              className="h-10 w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] pl-10 pr-4 text-sm text-[#e6edf3] placeholder-[#30363d] outline-none focus:border-[#1f6feb] transition-all"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-10 bg-[#238636] hover:bg-[#2ea043] text-white border-0 text-sm font-semibold px-6"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'Analyze'
            )}
          </Button>
        </form>

        {error && (
          <p className="px-1 text-xs text-[#f85149]">
            {error}
          </p>
        )}

        {/* Example chips */}
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider mr-1">Examples:</span>
          {presets.slice(0, 3).map((item) => (
            <button
              key={item.repo}
              type="button"
              onClick={() => handlePreset(item.repo)}
              className="px-2 py-0.5 rounded border border-[rgba(240,246,252,0.1)] bg-[#161b22] text-[11px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#8b949e] transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
