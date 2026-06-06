export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public retryable: boolean = false,
    public context?: Record<string, any>,
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

  const msg = err instanceof Error ? err.message : 'Internal Server Error';
  const isRate = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429');
  const isPrivate = msg.toLowerCase().includes('private') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('404');

  return {
    error: msg,
    code: isRate ? 'RATE_LIMIT_EXCEEDED' : isPrivate ? 'REPO_INACCESSIBLE' : 'INTERNAL_ERROR',
    status: isPrivate ? 404 : isRate ? 429 : 500,
    retryable: isRate || msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('network'),
  };
}
