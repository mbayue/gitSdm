export function formatRetryDelay(milliseconds: number): string {
  const minutes = Math.ceil(Math.max(0, milliseconds) / 60000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours} hr${remaining ? ` ${remaining} min` : ''}`;
}
