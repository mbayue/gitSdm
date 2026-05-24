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
