import path from 'node:path';
import { handleApiRequest } from './api-router';
import { resetOctokit } from './github/client';
import { addSecurityHeaders } from './utils/http';
import { logInfo } from './utils/logger';
import { isRepositoryPage } from './utils/page-route';

const distDir = path.resolve(import.meta.dir, '../dist');
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

resetOctokit();

Bun.serve({
  port,
  hostname: host,
  async fetch(req: Request, server): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      const response = await handleApiRequest(req, server.requestIP(req)?.address);
      if (response) return response;
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Serve static files
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(pathname);
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    const pageFile =
      decodedPath === '/'
        ? '/index.html'
        : /^\/(privacy|terms)\/?$/.test(decodedPath)
          ? `/${decodedPath.split('/')[1]}.html`
          : decodedPath;
    const filePath = safeJoin(distDir, pageFile);
    if (!filePath) return addSecurityHeaders(new Response('Not found', { status: 404 }));
    const file = Bun.file(filePath);
    if (await file.exists()) {
      const res = new Response(file);
      if (pathname.startsWith('/assets/')) {
        res.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      return addSecurityHeaders(res);
    }

    const validRoute = isRepositoryPage(decodedPath);
    const fallbackRes = new Response(Bun.file(path.join(distDir, validRoute ? 'app.html' : '404.html')), {
      status: validRoute ? 200 : 404,
    });
    fallbackRes.headers.set('Cache-Control', 'no-cache');
    return addSecurityHeaders(fallbackRes);
  },
});

const hasToken = Boolean(process.env.GITHUB_TOKEN?.trim());
logInfo(`[gitSdm] listening on http://${host}:${port}`);
logInfo(`[gitSdm] GitHub API: ${hasToken ? 'authenticated' : 'unauthenticated'}`);

function safeJoin(root: string, pathname: string): string | null {
  const normalized = pathname.replace(/^[/\\]+/, '');
  const resolved = path.resolve(root, normalized);

  // Ensure the resolved path strictly resides within the root directory
  // by appending the path separator to avoid sibling directory traversal
  // (e.g. preventing /app/dist-server from bypassing /app/dist check).
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved === root || resolved.startsWith(rootPrefix)) {
    return resolved;
  }

  return null;
}
