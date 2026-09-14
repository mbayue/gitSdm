import { Link, useLocation } from 'react-router-dom';
import { prefersReducedMotion } from '@/lib/motion-preference';

const links = [
  ['Home', '/'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
] as const;

export function SiteFooter() {
  const { pathname } = useLocation();
  return (
    <footer className="mt-auto border-t border-border px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex shrink-0 items-center gap-4">
          <span className="text-sm font-semibold text-foreground">gitSdm</span>
          <span className="text-xs text-muted-foreground">© 2026</span>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground md:justify-end"
        >
          {links.map(([label, href]) => (
              <Link
                key={href}
                to={href}
                className="transition-colors hover:text-foreground"
                onClick={(event) => {
                  if (
                    href !== '/' || pathname !== '/' || event.button !== 0 ||
                    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
                  ) return;
                  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
                }}
              >
                {label}
              </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
