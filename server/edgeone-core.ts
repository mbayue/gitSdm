import { handleApiRequest } from './api-router';

export async function handler(context: { request: Request; env?: Record<string, string | undefined> }): Promise<Response> {
  if (context.env) {
    for (const [key, value] of Object.entries(context.env)) {
      if (process.env[key] === undefined && value !== undefined) {
        process.env[key] = value;
      }
    }
  }

  const response = await handleApiRequest(context.request);
  if (!response) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return response;
}