import { AppError } from './errors';

/** Deadlines reject callers promptly, but running work holds its slot until it actually settles. */
export function createBoundedQueue(concurrency = 2, maxWaiting = 8, waitMs = 10000, runMs = 30000) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return <T>(work: (signal: AbortSignal) => Promise<T>, callerSignal?: AbortSignal): Promise<T> =>
    new Promise((resolve, reject) => {
      if (callerSignal?.aborted) {
        reject(callerSignal.reason || new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true));
        return;
      }
      if (active >= concurrency && waiting.length >= maxWaiting) {
        reject(new AppError(429, 'Provider queue is full. Please retry later.', 'PROVIDER_BUSY', true));
        return;
      }
      let waitTimer: ReturnType<typeof setTimeout> | undefined;
      let onWaitAbort: (() => void) | undefined;
      const cleanupWait = () => {
        clearTimeout(waitTimer);
        if (onWaitAbort && callerSignal) callerSignal.removeEventListener('abort', onWaitAbort);
      };
      const start = () => {
        cleanupWait();
        if (callerSignal?.aborted) {
          waiting.shift()?.();
          reject(callerSignal.reason || new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true));
          return;
        }
        active++;
        let settled = false;
        const controller = new AbortController();

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          controller.abort();
          reject(new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true));
        }, runMs);

        const onActiveAbort = () => {
          if (settled) return;
          settled = true;
          controller.abort(callerSignal?.reason);
          reject(callerSignal?.reason || new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true));
        };
        if (callerSignal) {
          callerSignal.addEventListener('abort', onActiveAbort, { once: true });
        }

        Promise.resolve()
          .then(() => work(controller.signal))
          .then(
            (val) => {
              clearTimeout(timer);
              if (callerSignal) callerSignal.removeEventListener('abort', onActiveAbort);
              active--;
              waiting.shift()?.();
              if (!settled) {
                settled = true;
                resolve(val);
              }
            },
            (err) => {
              clearTimeout(timer);
              if (callerSignal) callerSignal.removeEventListener('abort', onActiveAbort);
              active--;
              waiting.shift()?.();
              if (!settled) {
                settled = true;
                reject(err);
              }
            },
          );
      };

      if (active < concurrency) start();
      else {
        waiting.push(start);
        if (callerSignal) {
          onWaitAbort = () => {
            const index = waiting.indexOf(start);
            if (index >= 0) waiting.splice(index, 1);
            cleanupWait();
            reject(callerSignal.reason || new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true));
          };
          callerSignal.addEventListener('abort', onWaitAbort, { once: true });
        }
        waitTimer = setTimeout(() => {
          const index = waiting.indexOf(start);
          if (index >= 0) waiting.splice(index, 1);
          cleanupWait();
          reject(new AppError(429, 'Provider queue wait expired. Please retry.', 'PROVIDER_BUSY', true));
        }, waitMs);
      }
    });
}
