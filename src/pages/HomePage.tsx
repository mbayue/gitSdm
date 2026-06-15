import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsStrip } from '@/components/home/StatsStrip';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Trending } from '@/components/home/Trending';
import { CapabilityGroups } from '@/components/home/CapabilityGroups';
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
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: '#0d1117' }}>
      <Navbar />
      <HeroSection initialUrl={repoUrl} />
      <StatsStrip />
      <HowItWorks />
      <Trending onSelect={setRepoUrl} />
      <CapabilityGroups />
      <footer className="mt-auto border-t border-[rgba(240,246,252,0.1)] py-8 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-[#e6edf3]">gitSdm</span>
            <span className="text-xs text-[#8b949e]">© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/bayue48/gitSdm" className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors">GitHub</a>
            <a href="/docs" className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors">Docs</a>
            <a href="https://github.com/bayue48/gitSdm/issues" className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors">Issues</a>
            <span className="text-xs text-[#8b949e]">MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
