import { AppError } from './errors';

/** Deadlines reject callers promptly, but running work holds its slot until it actually settles. */
export function createBoundedQueue(concurrency = 2, maxWaiting = 8, waitMs = 10000, runMs = 30000) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return <T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      if (active >= concurrency && waiting.length >= maxWaiting) {
        reject(new AppError(429, 'Provider queue is full. Please retry later.', 'PROVIDER_BUSY', true));
        return;
      }
      let waitTimer: ReturnType<typeof setTimeout> | undefined;
      const start = () => {
        clearTimeout(waitTimer);
        active++;
        const controller = new AbortController();
        const timer = setTimeout(() => {
          controller.abort();
          reject(new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true));
        }, runMs);
        Promise.resolve()
          .then(() => work(controller.signal))
          .then(
            (val) => {
              clearTimeout(timer);
              active--;
              waiting.shift()?.();
              resolve(val);
            },
            (err) => {
              clearTimeout(timer);
              active--;
              waiting.shift()?.();
              reject(err);
            },
          );
      };
      if (active < concurrency) start();
      else {
        waiting.push(start);
        waitTimer = setTimeout(() => {
          const index = waiting.indexOf(start);
          if (index >= 0) waiting.splice(index, 1);
          reject(new AppError(429, 'Provider queue wait expired. Please retry.', 'PROVIDER_BUSY', true));
        }, waitMs);
      }
    });
}
