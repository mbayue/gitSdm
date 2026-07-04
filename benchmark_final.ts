import { findWorkspacePackageForPath } from './server/parser/dependency-analyzer';
import type { WorkspacePackage } from './src/types';

const packages: WorkspacePackage[] = Array.from({ length: 100 }, (_, i) => ({
  name: `pkg-${i}`,
  rootPath: `packages/pkg-${i}`,
  manifestPath: `packages/pkg-${i}/package.json`,
  ecosystem: 'javascript',
  manager: 'npm'
}));
packages.push({
  name: 'root',
  rootPath: '',
  manifestPath: 'package.json',
  ecosystem: 'javascript',
  manager: 'npm'
});

const paths = Array.from({ length: 50000 }, (_, i) => {
  const pkgId = i % 100;
  return `packages/pkg-${pkgId}/src/file-${i}.ts`;
});
paths.push('index.ts');

const sortedPackages = [...packages].sort((a, b) => b.rootPath.length - a.rootPath.length);

const start = performance.now();
for (const path of paths) {
  findWorkspacePackageForPath(path, sortedPackages);
}
const end = performance.now();
console.log(`Optimized: ${end - start} ms`);
