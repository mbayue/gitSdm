import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleNodeRequest } from './utils/http';
import { loadServerEnv } from './env';

loadServerEnv(process.env.VERCEL_ENV === 'production' ? 'production' : 'development');

export function createVercelHandler(_pathname: string) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const handled = await handleNodeRequest(req, res);
    if (!handled) {
      res.status(404).json({ error: 'Not found' });
    }
  };
}
