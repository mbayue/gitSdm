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

  const msg = err instanceof Error ? err.message : 'Internal Server Error';
  const lowerMsg = msg.toLowerCase();

  const isRate = lowerMsg.includes('rate limit') || lowerMsg.includes('429');
  const isPrivate = lowerMsg.includes('private') || lowerMsg.includes('not found') || lowerMsg.includes('404');
  const isNetwork = lowerMsg.includes('timeout') || lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('connect');

  // Security: Prevent information disclosure (e.g. file paths or internal stack details)
  // by sanitizing raw internal error messages before sending them to the client.
  let safeMsg = 'Internal Server Error';
  if (isRate) safeMsg = 'API rate limit exceeded';
  else if (isPrivate) safeMsg = 'Repository not found or is private';
  else if (isNetwork) safeMsg = 'Network connection failed';

  return {
    error: safeMsg,
    code: isRate ? 'RATE_LIMIT_EXCEEDED' : isPrivate ? 'REPO_INACCESSIBLE' : 'INTERNAL_ERROR',
    status: isPrivate ? 404 : isRate ? 429 : 500,
    retryable: isRate || isNetwork,
  };
}
