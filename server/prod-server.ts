import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './api-router';
import { resetOctokit } from './github/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
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
    const filePath = safeJoin(distDir, decodeURIComponent(pathname));
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    // SPA fallback
    return new Response(Bun.file(indexFile));
  },
});

const hasToken = Boolean(process.env.GITHUB_TOKEN?.trim());
console.log(`[gitSdm] listening on http://${host}:${port}`);
console.log(`[gitSdm] GitHub API: ${hasToken ? 'authenticated' : 'unauthenticated'}`);

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
