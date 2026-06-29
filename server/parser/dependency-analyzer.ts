import type { Dependency, ScopedDependency, WorkspaceManifest, WorkspacePackage } from '../../src/types';
import { detectWorkspaceManifest, parseManifest, parsePackageJsonName, parsePackageJsonScoped } from './manifest-parsers';

export function analyzeDependencies(fileContents: Record<string, string>): Dependency[] {
  const all: Dependency[] = [];
  const seen = new Set<string>();

  for (const [path, content] of Object.entries(fileContents)) {
    const deps = parseManifest(path, content);
    for (const dep of deps) {
      const key = `${dep.ecosystem}:${dep.name}:${dep.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        all.push(dep);
      }
    }
  }

  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function analyzeManifestDependencies(fileContents: Record<string, string>): ScopedDependency[] {
  const all: ScopedDependency[] = [];

  for (const [path, content] of Object.entries(fileContents)) {
    if (!path.endsWith('package.json')) continue;
    all.push(...parsePackageJsonScoped(path, content));
  }

  return all.sort((a, b) => a.manifestPath.localeCompare(b.manifestPath) || a.name.localeCompare(b.name));
}

function packageRootFromManifest(path: string): string {
  return path === 'package.json' ? '' : path.slice(0, -'/package.json'.length);
}

function escapeRegex(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegex(glob: string): RegExp {
  const parts = glob.split('/').map((part) => {
    if (part === '**') return '(?:[^/]+/)*[^/]*';
    return escapeRegex(part).replace(/\*/g, '[^/]*');
  });
  return new RegExp(`^${parts.join('/')}$`);
}

function matchesWorkspaceGlob(rootPath: string, packageGlobs: readonly string[]): boolean {
  return packageGlobs.some((glob) => globToRegex(glob).test(rootPath));
}

function packageRecord(
  base: Omit<WorkspacePackage, 'name'>,
  name: string | undefined,
): WorkspacePackage {
  return name ? { ...base, name } : base;
}

function detectWorkspaceManifests(fileContents: Record<string, string>): WorkspaceManifest[] {
  return Object.entries(fileContents)
    .flatMap(([path, content]) => {
      const manifest = detectWorkspaceManifest(path, content);
      return manifest ? [manifest] : [];
    })
    .sort((a, b) => a.manifestPath.localeCompare(b.manifestPath));
}

export function analyzeWorkspacePackages(fileContents: Record<string, string>): WorkspacePackage[] {
  const rootPackage = fileContents['package.json'];
  if (!rootPackage) return [];

  const manifests = detectWorkspaceManifests(fileContents);
  if (manifests.length === 0 && !rootPackage.includes('workspaces')) return [];

  const manager = manifests[0]?.manager ?? 'npm';
  const packages: WorkspacePackage[] = [packageRecord({
    ecosystem: 'javascript',
    manager,
    rootPath: '',
    manifestPath: 'package.json',
  }, parsePackageJsonName(rootPackage))];

  for (const [path, content] of Object.entries(fileContents)) {
    if (!path.endsWith('/package.json')) continue;
    const rootPath = packageRootFromManifest(path);
    const manifest = manifests.find((entry) => matchesWorkspaceGlob(rootPath, entry.packageGlobs));
    if (!manifest) continue;
    packages.push(packageRecord({
      ecosystem: manifest.ecosystem,
      manager: manifest.manager,
      rootPath,
      manifestPath: path,
    }, parsePackageJsonName(content)));
  }

  return packages.sort((a, b) => a.rootPath.localeCompare(b.rootPath));
}

export function findWorkspacePackageForPath(
  path: string,
  packages: readonly WorkspacePackage[],
): WorkspacePackage | undefined {
  return packages
    .filter((pkg) => pkg.rootPath === '' || path === pkg.rootPath || path.startsWith(`${pkg.rootPath}/`))
    .sort((a, b) => b.rootPath.length - a.rootPath.length)[0];
}
