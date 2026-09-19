import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from '@/app/providers';
import { AppRouter } from '@/app/router';
import '@/styles/globals.css';

async function start() {
  const initialPath = window.location.pathname;
  const initialPage =
    initialPath === '/'
      ? (await import('@/pages/HomePage')).HomePage
      : /^\/privacy\/?$/.test(initialPath)
        ? (await import('@/pages/PrivacyPage')).PrivacyPage
        : /^\/terms\/?$/.test(initialPath)
          ? (await import('@/pages/TermsPage')).TermsPage
          : /^\/[^/]+\/[^/]+\/search\/?$/.test(initialPath)
            ? (await import('@/pages/SearchPage')).SearchPage
            : /^\/[^/]+\/[^/]+\/?$/.test(initialPath)
              ? (await import('@/pages/VizPage')).VizPage
              : (await import('@/pages/NotFoundPage')).NotFoundPage;
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <AppRouter initialPage={initialPage} initialPath={initialPath} />
      </Providers>
    </StrictMode>,
  );
}
void start().catch(() => {
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'Interactive features could not load. Please refresh to try again.';
  document.body.appendChild(message);
});
