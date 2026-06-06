import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { VizPage } from '@/pages/VizPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:owner/:repo" element={<VizPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
