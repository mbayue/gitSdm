import { AppError } from '../utils/errors';

interface IndexRequest {
  cancelled: boolean;
  active: boolean;
  expires: number;
  cancelWork?: () => void;
  workKey?: string;
  buildId?: string;
}

/** Bounded cancellation records also cover requests whose metadata lookup has not completed. */
export function createIndexRequests(now = Date.now, capacity = 64) {
  const requests = new Map<string, IndexRequest>();
  const owners = new Map<string, IndexRequest>();
  // Cancellation-before-start protection must never reserve build capacity.
  const cancellations = new Map<string, number>();
  const rememberCancellation = (key: string) => {
    for (const [id, expires] of cancellations) if (expires <= now()) cancellations.delete(id);
    cancellations.delete(key);
    while (cancellations.size >= 256) cancellations.delete(cancellations.keys().next().value!);
    cancellations.set(key, now() + 2 * 60 * 1000);
  };
  const remove = (key: string, request: IndexRequest) => {
    requests.delete(key);
    if (request.workKey && owners.get(request.workKey) === request) owners.delete(request.workKey);
  };
  const allocate = (key: string) => {
    for (const [id, request] of requests) if (!request.active && request.expires <= now()) remove(id, request);
    let request = requests.get(key);
    if (!request) {
      if (requests.size >= capacity)
        throw new AppError(429, 'Too many indexing requests. Retry later.', 'INDEXING_BUSY', true);
      request = {
        cancelled: (cancellations.get(key) ?? 0) > now(),
        active: false,
        expires: now() + 25 * 60 * 60 * 1000,
      };
      requests.set(key, request);
    }
    return request;
  };
  return {
    begin(key: string, buildId?: string) {
      const request = allocate(key);
      request.buildId = buildId;
      if (request.active) throw new AppError(409, 'Indexing is already in progress.', 'INDEXING_IN_PROGRESS');
      request.active = true;
      const resuming = !!request.workKey && owners.get(request.workKey) === request;
      let attached = false;
      return {
        cancelled: () => request.cancelled,
        attach(workKey: string, cancelWork: () => void) {
          attached = true;
          request.workKey = workKey;
          owners.set(workKey, request);
          request.cancelWork = () => {
            if (owners.get(workKey) === request) cancelWork();
          };
          if (request.cancelled) request.cancelWork();
        },
        finish(keep = false, retainCancellation = true) {
          keep ||= resuming && !attached && !request.cancelled;
          keep &&= !request.cancelled;
          request.active = false;
          if (!keep) {
            request.cancelWork = undefined;
            if (request.workKey && owners.get(request.workKey) === request) owners.delete(request.workKey);
          }
          if (!keep) {
            if (request.cancelled && retainCancellation) rememberCancellation(key);
            remove(key, request);
          } else request.expires = now() + 25 * 60 * 60 * 1000;
        },
      };
    },
    cancel(key: string) {
      rememberCancellation(key);
      const request = requests.get(key);
      if (!request) return;
      request.cancelled = true;
      request.cancelWork?.();
      if (!request.active) remove(key, request);
    },
    cancelPending(key: string): boolean {
      const request = requests.get(key);
      if (!request?.active) return false;
      request.cancelled = true;
      request.cancelWork?.();
      return true;
    },
    buildId(workKey: string) {
      return owners.get(workKey)?.buildId;
    },
  };
}

export const indexRequests = createIndexRequests();
