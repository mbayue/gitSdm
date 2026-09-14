import { AppError } from './errors';

export const MAX_BODY_BYTES = 256 * 1024;

export function checkBodySize(bytes: number): void {
  if (bytes > MAX_BODY_BYTES) throw new AppError(413, 'Request body is too large', 'PAYLOAD_TOO_LARGE');
}

/** Bound the stream before JSON parsing, including requests without Content-Length. */
export async function limitRequestBody(req: Request, timeoutMs = 15000): Promise<Request> {
  checkBodySize(Number(req.headers.get('content-length') ?? 0));
  if (!req.body) return req;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new AppError(408, 'Request body timed out.', 'REQUEST_TIMEOUT', true)), timeoutMs);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      checkBodySize(size);
      chunks.push(value);
    }
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body,
    signal: req.signal,
  });
}

/** Process-wide ceiling; no growing client map and no waiting queue. */
export function createAdmissionLimit(maxActive = 8, maxPerMinute = 120, now = Date.now) {
  let active = 0;
  let started = now();
  let count = 0;
  return () => {
    const time = now();
    if (time - started >= 60_000) {
      started = time;
      count = 0;
    }
    if (active >= maxActive || count >= maxPerMinute) return null;
    active++;
    count++;
    let released = false;
    return () => {
      if (!released) {
        active--;
        released = true;
      }
    };
  };
}
