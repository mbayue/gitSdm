export function stripMermaidFences(code: string): string {
  let stripped = code.trim();
  if (stripped.startsWith('```mermaid')) {
    stripped = stripped.slice(10);
  } else if (stripped.startsWith('```')) {
    stripped = stripped.slice(3);
  }
  if (stripped.endsWith('```')) {
    stripped = stripped.slice(0, -3);
  }
  return stripped.trim();
}
