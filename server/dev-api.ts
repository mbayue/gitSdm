import type { Plugin } from 'vite';
import { handleNodeRequest } from './utils/http';
import { loadServerEnv } from './env';
import { resetOctokit } from './github/client';

export function apiMiddleware(): Plugin {
  return {
    name: 'gitsdm-api',
    configureServer(server) {
      loadServerEnv(server.config.mode);
      resetOctokit();

      server.httpServer?.once('listening', () => {
        const hasToken = Boolean(process.env.GITHUB_TOKEN?.trim());
        console.log(
          `[gitSdm] GitHub API: ${hasToken ? 'authenticated (GITHUB_TOKEN loaded)' : 'unauthenticated — add GITHUB_TOKEN to .env'}`,
        );
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const pathname = url.split('?')[0];

        if (!pathname.startsWith('/api/')) {
          next();
          return;
        }

        const handled = await handleNodeRequest(req, res);
        if (!handled) {
          sendNotFound(res);
        }
      });
    },
  };
}

function sendNotFound(res: import('http').ServerResponse): void {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
}
