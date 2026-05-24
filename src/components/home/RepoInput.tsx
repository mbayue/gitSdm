import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { parseRepoFromUrl, LAST_REPO_KEY } from '@/lib/utils';
interface RepoInputProps {
  initialUrl?: string;
}

export function RepoInput({ initialUrl = '' }: RepoInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseRepoFromUrl(url);
    if (!parsed) {
      setError('Enter a valid GitHub URL (e.g. facebook/react)');
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
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
              placeholder="https://github.com/owner/repo"
              className="pl-10"
              disabled={loading}
            />
          </div>
          <GlowButton type="submit" loading={loading} className="sm:shrink-0">
            Visualize
            <ArrowRight className="h-4 w-4" />
          </GlowButton>
        </form>
        {error && <p className="mt-2 px-2 text-sm text-red-400">{error}</p>}
      </GlassCard>
    </motion.div>
  );
}
