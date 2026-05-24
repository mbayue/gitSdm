import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/home/Hero';
import { RepoInput } from '@/components/home/RepoInput';
import { PreviewGraph } from '@/components/home/PreviewGraph';
import { Trending } from '@/components/home/Trending';
import { FeatureShowcase } from '@/components/home/FeatureShowcase';
import { LAST_REPO_KEY } from '@/lib/utils';

export function HomePage() {
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem(LAST_REPO_KEY) ?? '');

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (!sectionId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mesh-bg min-h-screen">
      <Navbar />
      <Hero />
      <RepoInput initialUrl={repoUrl} />
      <PreviewGraph />
      <Trending onSelect={setRepoUrl} />
      <FeatureShowcase />
      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        gitSdm — visualize public GitHub repositories
      </footer>
    </div>
  );
}
