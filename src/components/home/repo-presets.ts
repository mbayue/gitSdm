export const REPO_PRESETS = [
  { label: '📦 Mock Todo App', repo: 'mock/todo-app', desc: 'Offline mode' },
  { label: '🔮 Mock gitSdm', repo: 'mock/gitsdm', desc: 'Offline mode' },
  { label: '⚛️ React', repo: 'facebook/react', desc: 'UI library' },
  { label: '▲ Next.js', repo: 'vercel/next.js', desc: 'React framework' },
  { label: '🐍 FastAPI', repo: 'tiangolo/fastapi', desc: 'Python API' },
  { label: '✨ gitSdm', repo: 'bayue48/gitSdm', desc: 'This app' },
];

export function getVisibleRepoPresets(showMockPresets: boolean) {
  return REPO_PRESETS.filter((item) => showMockPresets || !item.repo.startsWith('mock/'));
}
