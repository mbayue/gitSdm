import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { handleNodeRequest } from './utils/http';
import { logInfo } from './utils/logger';
import { loadServerEnv } from './env';
import { resetOctokit } from './github/client';
import { isRepositoryPage } from './utils/page-route';

export function apiMiddleware(): Plugin {
  return {
    name: 'gitsdm-api',
    configureServer(server) {
      loadServerEnv(server.config.mode);
      resetOctokit();

      server.httpServer?.once('listening', () => {
        const hasToken = Boolean(process.env.GITHUB_TOKEN?.trim());
        logInfo(
          `[gitSdm] GitHub API: ${hasToken ? 'authenticated (GITHUB_TOKEN loaded)' : 'unauthenticated — add GITHUB_TOKEN to .env'}`
        );
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const pathname = url.split('?')[0];

        if (pathname.startsWith('/api/')) {
          const handled = await handleNodeRequest(req, res);
          if (!handled) {
            sendNotFound(res);
          }
          return;
        }

        if (pathname.startsWith('/assets/')) {
          sendNotFound(res);
          return;
        }

        if (
          req.method === 'GET' &&
          req.headers.accept?.includes('text/html') &&
          !pathname.startsWith('/@') &&
          !pathname.startsWith('/src') &&
          !pathname.startsWith('/node_modules') &&
          !pathname.startsWith('/assets') &&
          !pathname.includes('.') &&
          pathname !== '/' &&
          !/^\/(privacy|terms)\/?$/.test(pathname) &&
          !isRepositoryPage(pathname)
        ) {
          try {
            const template = fs.readFileSync(path.resolve('index.html'), 'utf8');
            const html = await server.transformIndexHtml(url, template);
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
            return;
          } catch {
            // fallback to default pipeline if transform fails
          }
        }

        next();
      });
    },
  };
}

function sendNotFound(res: import('http').ServerResponse): void {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
}
