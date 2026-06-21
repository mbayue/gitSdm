import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'examples', label: 'Examples' },
  { id: 'how-it-works', label: 'Demo' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = (sectionId: string) => {
    const scrollToSection = () => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    if (location.pathname !== '/') {
      navigate({ pathname: '/', hash: `#${sectionId}` });
      window.setTimeout(scrollToSection, 80);
      return;
    }

    if (location.hash !== `#${sectionId}`) {
      navigate({ pathname: '/', hash: `#${sectionId}` }, { replace: true });
    }
    scrollToSection();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Label */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-[#e6edf3] font-bold text-lg tracking-tight">
            gitSdm
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded border border-[rgba(240,246,252,0.1)] bg-[#161b22] text-[10px] font-medium text-[#8b949e] uppercase tracking-wider">
            Repository Map
          </span>
        </div>

        {/* Center/Right: Links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goToSection(link.id)}
              className="text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          <a
            href="https://github.com/mbayue/gitSdm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-[1px] bg-[rgba(240,246,252,0.1)] hidden md:block" />
          <button className="p-2 text-[#8b949e] hover:text-[#e6edf3] transition-colors">
            <Sparkles className="h-4 w-4" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToSection('analyze')}
            className="h-8 border-[rgba(240,246,252,0.1)] bg-[#161b22] text-[#e6edf3] hover:bg-[#1c2128] text-xs px-3"
          >
            Analyze
          </Button>
        </div>
      </div>
    </nav>
  );
}
