import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiRequest } from './api-router';
import { loadServerEnv } from './env';

loadServerEnv(process.env.VERCEL_ENV === 'production' ? 'production' : 'development');

export function createVercelHandler(pathname: string) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const handled = await handleApiRequest(req, res, pathname);
    if (!handled) {
      res.status(404).json({ error: 'Not found' });
    }
  };
}
