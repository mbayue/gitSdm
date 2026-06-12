export function logApi(
  route: string,
  meta: Record<string, string | number | boolean | undefined>,
): void {
  console.log(
    JSON.stringify({
      level: 'info',
      route,
      timestamp: new Date().toISOString(),
      ...meta,
    }),
  );
}

export function logError(
  route: string,
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(
    JSON.stringify({
      level: 'error',
      route,
      timestamp: new Date().toISOString(),
      error: message,
      stack,
      ...meta,
    }),
  );
}
