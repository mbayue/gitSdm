import type { IncomingMessage, ServerResponse } from 'http';

export type ApiRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
};

export function parseQuery(url: string): Record<string, string> {
  const q = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(q);
  const result: Record<string, string> = {};
  params.forEach((v, k) => {
    result[k] = v;
  });
  return result;
}

export async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function sendError(
  res: ServerResponse,
  status: number,
  message: string,
  details?: unknown,
): void {
  sendJson(res, status, { error: message, details });
}
