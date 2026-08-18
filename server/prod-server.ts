import path from 'node:path';
import { handleApiRequest } from './api-router';
import { resetOctokit } from './github/client';
import { addSecurityHeaders } from './utils/http';
import { logInfo } from './utils/logger';

const distDir = path.resolve(import.meta.dir, '../dist');
const indexFile = path.join(distDir, 'index.html');
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

resetOctokit();

Bun.serve({
  port,
  hostname: host,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      const response = await handleApiRequest(req);
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

    const filePath = safeJoin(distDir, decodedPath);
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return addSecurityHeaders(new Response(file));
    }

    // SPA fallback
    return addSecurityHeaders(new Response(Bun.file(indexFile)));
  },
});

const hasToken = Boolean(process.env.GITHUB_TOKEN?.trim());
logInfo(`[gitSdm] listening on http://${host}:${port}`);
logInfo(`[gitSdm] GitHub API: ${hasToken ? 'authenticated' : 'unauthenticated'}`);

function safeJoin(root: string, pathname: string): string {
  const normalized = pathname.replace(/^[/\\]+/, '');
  const resolved = path.resolve(root, normalized);

  // Ensure the resolved path strictly resides within the root directory
  // by appending the path separator to avoid sibling directory traversal
  // (e.g. preventing /app/dist-server from bypassing /app/dist check).
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved === root || resolved.startsWith(rootPrefix)) {
    return resolved;
  }

  return indexFile;
}
