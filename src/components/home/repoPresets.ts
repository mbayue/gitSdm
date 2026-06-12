export const REPO_PRESETS = [
  { label: 'Mock Todo App', repo: 'mock/todo-app', desc: 'Offline mode', icon: 'ListTodo' },
  { label: 'Mock gitSdm', repo: 'mock/gitsdm', desc: 'Offline mode', icon: 'Boxes' },
  { label: 'React', repo: 'facebook/react', desc: 'UI library', icon: 'Atom' },
  { label: 'Next.js', repo: 'vercel/next.js', desc: 'React framework', icon: 'Triangle' },
  { label: 'FastAPI', repo: 'tiangolo/fastapi', desc: 'Python API', icon: 'Terminal' },
  { label: 'Vite', repo: 'vitejs/vite', desc: 'Build tool', icon: 'Zap' },
  { label: 'gitSdm', repo: 'bayue48/gitSdm', desc: 'This app', icon: 'GitBranch' },
];

export function getVisibleRepoPresets(showMockPresets: boolean) {
  return REPO_PRESETS.filter((item) => showMockPresets || !item.repo.startsWith('mock/'));
}
