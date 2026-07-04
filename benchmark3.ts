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

function original(path: string, packages: readonly WorkspacePackage[]) {
  return packages
    .filter((pkg) => pkg.rootPath === '' || path === pkg.rootPath || path.startsWith(`${pkg.rootPath}/`))
    .sort((a, b) => b.rootPath.length - a.rootPath.length)[0];
}

function optimized1(path: string, packages: readonly WorkspacePackage[]) {
  let match: WorkspacePackage | undefined;
  let maxLen = -1;
  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    if (pkg.rootPath === '' || path === pkg.rootPath || path.startsWith(`${pkg.rootPath}/`)) {
      if (pkg.rootPath.length > maxLen) {
        maxLen = pkg.rootPath.length;
        match = pkg;
      }
    }
  }
  return match;
}

const sortedPackages = [...packages].sort((a, b) => b.rootPath.length - a.rootPath.length);

function optimized2(path: string, sortedPkgs: readonly WorkspacePackage[]) {
  return sortedPkgs.find((pkg) => pkg.rootPath === '' || path === pkg.rootPath || path.startsWith(`${pkg.rootPath}/`));
}

let start = performance.now();
for (const path of paths) {
  original(path, packages);
}
let end = performance.now();
console.log(`Original: ${end - start} ms`);

start = performance.now();
for (const path of paths) {
  optimized1(path, packages);
}
end = performance.now();
console.log(`Optimized 1 (O(N) loop): ${end - start} ms`);

start = performance.now();
for (const path of paths) {
  optimized2(path, sortedPackages);
}
end = performance.now();
console.log(`Optimized 2 (Pre-sorted + find): ${end - start} ms`);
