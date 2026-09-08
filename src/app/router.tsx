import { lazy, Suspense, type ComponentType } from 'react';
import { PageMetadata } from '@/components/layout/PageMetadata';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })));
const VizPage = lazy(() => import('@/pages/VizPage').then((module) => ({ default: module.VizPage })));
const SearchPage = lazy(() =>
  import('@/pages/SearchPage').then((module) => ({
    default: module.SearchPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);
const PrivacyPage = lazy(() =>
  import('@/pages/PrivacyPage').then((module) => ({
    default: module.PrivacyPage,
  })),
);

function RouterContent({ initialPage, initialPath }: { initialPage: ComponentType; initialPath: string }) {
  const location = useLocation();
  const InitialPage = initialPage;

  return (
    <ErrorBoundary key={location.pathname}>
      <PageMetadata path={location.pathname} />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          <Route path="/" element={initialPath === '/' ? <InitialPage /> : <HomePage />} />
          <Route path="/privacy" element={/^\/privacy\/?$/.test(initialPath) ? <InitialPage /> : <PrivacyPage />} />
          <Route
            path="/:owner/:repo"
            element={/^\/[^/]+\/[^/]+\/?$/.test(initialPath) ? <InitialPage /> : <VizPage />}
          />
          <Route
            path="/:owner/:repo/search"
            element={/^\/[^/]+\/[^/]+\/search\/?$/.test(initialPath) ? <InitialPage /> : <SearchPage />}
          />
          <Route path="*" element={location.pathname === initialPath ? <InitialPage /> : <NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export function AppRouter(props: { initialPage: ComponentType; initialPath: string }) {
  return (
    <BrowserRouter>
      <RouterContent {...props} />
    </BrowserRouter>
  );
}
