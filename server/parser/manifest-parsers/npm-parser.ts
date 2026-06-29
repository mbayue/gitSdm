import type { Dependency, ScopedDependency, WorkspaceManifest, WorkspaceManager } from '../../../src/types';
import type { ManifestParser } from './types';

type PackageJson = {
  readonly name?: string;
  readonly packageManager?: string;
  readonly workspaces?: readonly string[] | { readonly packages?: readonly string[] };
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
};

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === 'string');
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function parsePackageJsonObject(content: string): PackageJson | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const workspacesValue = record['workspaces'];
    const workspaces = parseWorkspaces(workspacesValue);
    return {
      name: typeof record['name'] === 'string' ? record['name'] : undefined,
      packageManager: typeof record['packageManager'] === 'string' ? record['packageManager'] : undefined,
      workspaces: workspaces ?? undefined,
      dependencies: isStringRecord(record['dependencies']) ? record['dependencies'] : undefined,
      devDependencies: isStringRecord(record['devDependencies']) ? record['devDependencies'] : undefined,
      peerDependencies: isStringRecord(record['peerDependencies']) ? record['peerDependencies'] : undefined,
    };
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

function parseWorkspaces(value: unknown): PackageJson['workspaces'] | null {
  if (isStringArray(value)) return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const packages = (value as Record<string, unknown>)['packages'];
  return isStringArray(packages) ? { packages } : null;
}

function getWorkspaceManager(pkg: PackageJson): WorkspaceManager {
  if (pkg.packageManager?.startsWith('bun@')) return 'bun';
  if (Array.isArray(pkg.workspaces)) return 'npm';
  return 'yarn';
}

function getWorkspaceGlobs(pkg: PackageJson): readonly string[] {
  const workspaces = pkg.workspaces;
  if (!workspaces) return [];
  if (isStringArray(workspaces)) return workspaces;
  return workspaces.packages ?? [];
}

export function parsePackageJson(content: string): Dependency[] {
  const pkg = parsePackageJsonObject(content);
  if (!pkg) return [];

  const deps: Dependency[] = [];
  for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
    deps.push({ name, version, type: 'prod', ecosystem: 'npm' });
  }
  for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
    deps.push({ name, version, type: 'dev', ecosystem: 'npm' });
  }
  for (const [name, version] of Object.entries(pkg.peerDependencies ?? {})) {
    deps.push({ name, version, type: 'peer', ecosystem: 'npm' });
  }
  return deps;
}

export function parsePackageJsonScoped(path: string, content: string): ScopedDependency[] {
  const pkg = parsePackageJsonObject(content);
  if (!pkg) return [];
  return parsePackageJson(content).map((dep) => ({
    ...dep,
    manifestPath: path,
    packageName: pkg.name,
  }));
}

export function parsePackageJsonName(content: string): string | undefined {
  return parsePackageJsonObject(content)?.name;
}

export function detectPackageJsonWorkspace(path: string, content: string): WorkspaceManifest | null {
  const pkg = parsePackageJsonObject(content);
  if (!pkg?.workspaces) return null;
  return {
    ecosystem: 'javascript',
    manager: getWorkspaceManager(pkg),
    manifestPath: path,
    packageGlobs: getWorkspaceGlobs(pkg),
  };
}

export function parsePnpmWorkspace(path: string, content: string): WorkspaceManifest | null {
  const lines = content.split('\n');
  const packageGlobs: string[] = [];
  let inPackages = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Stop parsing if we hit another top-level key or invalid formatting
    if (inPackages) {
      if (!line.startsWith(' ') && !line.startsWith('-')) {
        inPackages = false;
        break;
      }
      // If we are inside the packages block, lines should start with "- "
      if (!trimmed.startsWith('- ')) return null;
      packageGlobs.push(trimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    if (trimmed === 'packages:') {
      inPackages = true;
    }
  }

  if (packageGlobs.length === 0) return null;
  return { ecosystem: 'javascript', manager: 'pnpm', manifestPath: path, packageGlobs };
}

export const npmParser: ManifestParser = {
  name: 'npm',
  filePattern: 'package.json',
  parse: parsePackageJson,
};
