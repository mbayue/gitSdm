export function parsePaths(value: string): string[] {
  return value
    .split(',')
    .map((path) => path.trim())
    .filter(Boolean);
}
