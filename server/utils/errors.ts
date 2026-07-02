export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public retryable: boolean = false,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toErrorPayload(err: unknown) {
  if (isAppError(err)) {
    return {
      error: err.message,
      code: err.code,
      status: err.status,
      retryable: err.retryable,
      context: err.context,
    };
  }

  // [SECURITY] Sanitize generic error messages to prevent Information Disclosure
  // Raw err.message might contain sensitive file paths, internal IP addresses,
  // or system context that shouldn't be exposed to the client.
  const msg = err instanceof Error ? err.message : 'Internal Server Error';
  const isRate = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429');
  const isPrivate = msg.toLowerCase().includes('private') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('404');

  let sanitizedError = 'Internal Server Error';
  if (isRate) {
    sanitizedError = 'Rate limit exceeded';
  } else if (isPrivate) {
    sanitizedError = 'Repository not found or private';
  }

  return {
    error: sanitizedError,
    code: isRate ? 'RATE_LIMIT_EXCEEDED' : isPrivate ? 'REPO_INACCESSIBLE' : 'INTERNAL_ERROR',
    status: isPrivate ? 404 : isRate ? 429 : 500,
    retryable: isRate || msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('network'),
  };
}
