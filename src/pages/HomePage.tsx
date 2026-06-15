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
    <div className="min-h-screen" style={{ background: '#050509' }}>
      <Navbar />
      <HeroSection initialUrl={repoUrl} />
      <StatsStrip />
      <HowItWorks />
      <Trending onSelect={setRepoUrl} />
      <CapabilityGroups />
      <footer className="border-t border-[#272233] py-12 text-center">
        <p className="text-sm text-[#a1a1aa]">
          <span className="font-semibold text-[#f8fafc]">gitSdm</span> — AI-powered repository intelligence platform
        </p>
        <p className="mt-2 text-xs text-[#a1a1aa]/60">
          Public & private repositories supported · Powered by Google Gemini
        </p>
      </footer>
    </div>
  );
}
