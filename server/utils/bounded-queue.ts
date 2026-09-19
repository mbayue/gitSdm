import { AppError } from './errors';

const timeoutError = () => new AppError(504, 'Provider request timed out.', 'PROVIDER_TIMEOUT', true);

/** Deadlines reject callers promptly, but running work holds its slot until it actually settles. */
export function createBoundedQueue(concurrency = 2, maxWaiting = 8, waitMs = 10000, runMs = 30000) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return <T>(work: (signal: AbortSignal) => Promise<T>, callerSignal?: AbortSignal): Promise<T> =>
    new Promise((resolve, reject) => {
      if (callerSignal?.aborted) {
        reject(callerSignal.reason || timeoutError());
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
          reject(callerSignal.reason || timeoutError());
          return;
        }
        active++;
        let settled = false;
        const controller = new AbortController();

        const onActiveAbort = () => {
          if (settled) return;
          settled = true;
          controller.abort(callerSignal?.reason);
          reject(callerSignal?.reason || timeoutError());
        };
        const detachCallerAbort = () => {
          if (callerSignal) callerSignal.removeEventListener('abort', onActiveAbort);
        };

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          controller.abort();
          // The caller is gone even though the slot stays held until work settles.
          detachCallerAbort();
          reject(timeoutError());
        }, runMs);

        if (callerSignal) {
          callerSignal.addEventListener('abort', onActiveAbort, { once: true });
        }

        const releaseSlot = () => {
          clearTimeout(timer);
          detachCallerAbort();
          active--;
          waiting.shift()?.();
        };

        Promise.resolve()
          .then(() => {
            // Abort won the race before work started — release the slot
            // without invoking side-effecting work.
            if (settled) {
              releaseSlot();
              return new Promise<T>(() => {});
            }
            return work(controller.signal);
          })
          .then(
            (val) => {
              releaseSlot();
              if (!settled) {
                settled = true;
                resolve(val);
              }
            },
            (err) => {
              releaseSlot();
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
            reject(callerSignal.reason || timeoutError());
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
