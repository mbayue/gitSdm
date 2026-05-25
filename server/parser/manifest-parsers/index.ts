import type { Dependency } from '../../../src/types';

export function parsePackageJson(content: string): Dependency[] {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
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
  } catch {
    return [];
  }
}

export function parseRequirementsTxt(content: string): Dependency[] {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((line) => {
      const match = line.match(/^([a-zA-Z0-9_-]+)([>=<~!]+.*)?$/);
      return {
        name: match?.[1] ?? line.split(/[>=<]/)[0],
        version: match?.[2]?.replace(/^[=<>~!]+/, ''),
        type: 'prod' as const,
        ecosystem: 'python',
      };
    })
    .slice(0, 100);
}

export function parsePyproject(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const depSection = content.match(/\[project\.dependencies\]([\s\S]*?)(\[|$)/);
  if (depSection) {
    const lines = depSection[1].match(/"([^"]+)"/g) ?? [];
    for (const line of lines) {
      const pkg = line.replace(/"/g, '');
      const parts = pkg.split(/[=<>~!]+/);
      const name = parts[0]?.trim();
      const version = parts[1]?.trim();
      if (name) {
        deps.push({ name, version, type: 'prod', ecosystem: 'python' });
      }
    }
  }
  return deps;
}

export function parseCargoToml(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const section = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
  if (!section) return deps;
  const lines = section[1].split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const name = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();

    let version = '';
    if (val.startsWith('{')) {
      const versionMatch = val.match(/version\s*=\s*["']([^"']+)["']/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } else {
      const versionMatch = val.match(/^["']([^"']+)["']/);
      if (versionMatch) {
        version = versionMatch[1];
      } else {
        version = val;
      }
    }

    deps.push({ name, version, type: 'prod', ecosystem: 'rust' });
  }
  return deps;
}

export function parseGoMod(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const lines = content.split('\n');
  let inRequire = false;
  for (const line of lines) {
    if (line.trim() === 'require (') {
      inRequire = true;
      continue;
    }
    if (inRequire && line.trim() === ')') {
      inRequire = false;
      continue;
    }
    if (line.trim().startsWith('require ')) {
      const parts = line.trim().replace('require ', '').split(/\s+/);
      if (parts[0]) deps.push({ name: parts[0], version: parts[1], type: 'prod', ecosystem: 'go' });
      continue;
    }
    if (inRequire) {
      const parts = line.trim().split(/\s+/);
      if (parts[0] && !parts[0].startsWith('//')) {
        deps.push({ name: parts[0], version: parts[1], type: 'prod', ecosystem: 'go' });
      }
    }
  }
  return deps.slice(0, 80);
}

export function parseDockerfile(content: string): Dependency[] {
  const fromLines = content.match(/^FROM\s+(.+)$/gim) ?? [];
  return fromLines.map((line) => {
    const image = line.replace(/^FROM\s+/i, '').split(/\s+/)[0];
    return { name: image, type: 'prod' as const, ecosystem: 'docker' };
  });
}

export function parsePomXml(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const matches = content.matchAll(/<artifactId>([^<]+)<\/artifactId>/g);
  for (const m of matches) {
    if (m[1] && !m[1].includes('${')) {
      deps.push({ name: m[1], type: 'prod', ecosystem: 'java' });
    }
  }
  return deps.slice(0, 50);
}

export function parseManifest(path: string, content: string): Dependency[] {
  const base = path.split('/').pop() ?? path;
  switch (base) {
    case 'package.json':
      return parsePackageJson(content);
    case 'requirements.txt':
      return parseRequirementsTxt(content);
    case 'pyproject.toml':
      return parsePyproject(content);
    case 'Cargo.toml':
      return parseCargoToml(content);
    case 'go.mod':
      return parseGoMod(content);
    case 'Dockerfile':
      return parseDockerfile(content);
    case 'pom.xml':
      return parsePomXml(content);
    default:
      return [];
  }
}
