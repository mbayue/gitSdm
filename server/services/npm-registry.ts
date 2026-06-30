import { cache } from '../cache/lru';
import type { DependencyHealthMetadata, Dependency } from '../../src/types';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const BATCH_SIZE = 10;

export type NpmRegistryErrorKind = 'not-found' | 'invalid-json' | 'invalid-shape' | 'network-error' | 'missing-latest';

export type NpmRegistryError = {
  readonly kind: NpmRegistryErrorKind;
  readonly packageName: string;
  readonly error: string;
};

type NpmRegistryLicense = string | { readonly type?: unknown } | undefined;

type NpmRegistryPayload = {
  readonly 'dist-tags'?: { readonly latest?: unknown };
  readonly license?: NpmRegistryLicense;
};

type NpmDependency = Pick<Dependency, 'ecosystem' | 'name' | 'type'> & { readonly version?: string };
type NpmRegistrySummary = {
  readonly latestVersion: string;
  readonly license?: string;
  readonly checkedAt: string;
};

export function npmDependencyHealthCacheKey(name: string): string {
  return `dep-health:npm:${encodeURIComponent(name)}`;
}

export async function fetchNpmDependencyMetadata(
  packageName: string,
  currentVersion?: string,
): Promise<DependencyHealthMetadata | NpmRegistryError> {
  const cacheKey = npmDependencyHealthCacheKey(packageName);
  const cached = cache.get<NpmRegistrySummary>(cacheKey);
  if (cached) return buildDependencyHealthMetadata(currentVersion, cached);

  const response = await fetchNpmRegistryPackage(packageName);
  if ('kind' in response) return response;

  const summary = response;
  cache.set(cacheKey, summary, DEFAULT_CACHE_TTL_MS);
  return buildDependencyHealthMetadata(currentVersion, summary);
}

export async function fetchNpmDependencyMetadataBatch(
  dependencies: readonly NpmDependency[],
): Promise<Record<string, DependencyHealthMetadata>> {
  const result: Record<string, DependencyHealthMetadata> = {};

  for (const chunk of chunkDependencies(dependencies, BATCH_SIZE)) {
    const chunkResults = await Promise.all(chunk.map(async (dependency) => {
      const metadata = await fetchNpmDependencyMetadata(dependency.name, dependency.version);
      return [dependencyKey(dependency), metadata] as const;
    }));

    for (const [key, metadata] of chunkResults) {
      if ('kind' in metadata) {
        result[key] = {
          status: 'error',
          checkedAt: nowIsoString(),
          error: metadata.error,
        };
        continue;
      }

      result[key] = metadata;
    }
  }

  return result;
}

async function fetchNpmRegistryPackage(packageName: string): Promise<NpmRegistrySummary | NpmRegistryError> {
  const url = `${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return typedError('network-error', packageName, 'network error');
  }

  if (response.status === 404) {
    return typedError('not-found', packageName, 'package not found');
  }

  let payload: NpmRegistryPayload;
  try {
    payload = await response.json() as NpmRegistryPayload;
  } catch {
    return typedError('invalid-json', packageName, 'invalid JSON');
  }

  if (!isRecord(payload) || !isRecord(payload['dist-tags'])) {
    return typedError('invalid-shape', packageName, 'invalid registry shape');
  }

  const latest = payload['dist-tags'].latest;
  if (typeof latest !== 'string' || latest.trim() === '') {
    return typedError('missing-latest', packageName, 'missing latest version');
  }

  return {
    latestVersion: latest,
    license: extractLicense(payload.license),
    checkedAt: nowIsoString(),
  };
}

function buildDependencyHealthMetadata(
  currentVersion: string | undefined,
  metadata: NpmRegistrySummary,
): DependencyHealthMetadata {
  const normalizedCurrent = normalizeVersion(currentVersion);
  const normalizedLatest = normalizeVersion(metadata.latestVersion);

  if (!normalizedCurrent || !normalizedLatest) {
    return {
      ...metadata,
      status: 'unknown',
      ...(normalizedCurrent ? { currentVersion: normalizedCurrent } : {}),
      ...(normalizedLatest ? { latestVersion: normalizedLatest } : {}),
    };
  }

  return {
    status: compareVersions(normalizedCurrent, normalizedLatest) >= 0 ? 'current' : 'outdated',
    currentVersion: normalizedCurrent,
    latestVersion: normalizedLatest,
    ...(metadata.license ? { license: metadata.license } : {}),
    checkedAt: metadata.checkedAt,
  };
}

function typedError(kind: NpmRegistryErrorKind, packageName: string, error: string): NpmRegistryError {
  return { kind, packageName, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractLicense(license: NpmRegistryLicense): string | undefined {
  if (typeof license === 'string') return license;
  if (license && typeof license.type === 'string') return license.type;
  return undefined;
}

function chunkDependencies<T>(items: readonly T[], size: number): readonly T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function dependencyKey(dependency: NpmDependency): string {
  return `${dependency.ecosystem}:${dependency.name}:${dependency.type}`;
}

function normalizeVersion(version: string | undefined): string | undefined {
  if (!version) return undefined;
  const trimmed = version.trim();
  if (trimmed === '') return undefined;
  return trimmed.replace(/^v/, '').replace(/^[~^<>]=?\s*/, '');
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(/[.-]/).map(parseVersionPart);
  const rightParts = right.split(/[.-]/).map(parseVersionPart);
  const partCount = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < partCount; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

function parseVersionPart(part: string): number {
  const parsed = Number.parseInt(part, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nowIsoString(): string {
  return new Date().toISOString();
}
