import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type ServerResponse } from 'node:http';
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

const server = createServer(async (req, res) => {
  const url = req.url ?? '/';
  const pathname = url.split('?')[0] ?? '/';

  if (pathname.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res, pathname);
    if (!handled) sendNotFound(res);
    return;
  }

  await serveStatic(pathname, res);
});

server.listen(port, host, () => {
  const hasToken = Boolean(process.env.GITHUB_TOKEN?.trim());
  console.log(`[gitSdm] listening on http://${host}:${port}`);
  console.log(`[gitSdm] GitHub API: ${hasToken ? 'authenticated' : 'unauthenticated'}`);
});

async function serveStatic(pathname: string, res: ServerResponse): Promise<void> {
  const requestedPath = safeJoin(distDir, decodeURIComponent(pathname));
  const filePath = await resolveAsset(requestedPath);

  if (!filePath) {
    streamFile(indexFile, res);
    return;
  }

  streamFile(filePath, res);
}

async function resolveAsset(requestedPath: string): Promise<string | null> {
  try {
    const info = await stat(requestedPath);
    if (info.isFile()) return requestedPath;
    if (info.isDirectory()) {
      const nestedIndex = path.join(requestedPath, 'index.html');
      const nestedInfo = await stat(nestedIndex);
      if (nestedInfo.isFile()) return nestedIndex;
    }
  } catch {
    return null;
  }

  return null;
}

function safeJoin(root: string, pathname: string): string {
  const normalized = pathname.replace(/^[/\\]+/, '');
  const resolved = path.resolve(root, normalized);
  return resolved.startsWith(root) ? resolved : indexFile;
}

function streamFile(filePath: string, res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType(filePath));
  createReadStream(filePath)
    .on('error', () => sendNotFound(res))
    .pipe(res);
}

function sendNotFound(res: ServerResponse): void {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}
