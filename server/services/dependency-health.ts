import type {
  Dependency,
  DependencyHealthItem,
  DependencyHealthMetadata,
  DependencyHealthEcosystemSupport,
  DependencyHealthReport,
  DependencyHealthState,
  DependencyHealthSummary,
  ScopedDependency,
} from '../../src/types';

type DependencyGroup = {
  readonly dependency: Dependency;
  readonly scopedDependencies: ScopedDependency[];
};

type DependencyKey = string;

const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const ECOSYSTEM_SUPPORT: DependencyHealthEcosystemSupport = {
  npm: 'freshness',
  python: 'inventory-only',
  go: 'inventory-only',
  java: 'inventory-only',
  rust: 'inventory-only',
  docker: 'inventory-only',
};

export function buildDependencyHealthReport(
  dependencies: readonly Dependency[],
  scopedDependencies: readonly ScopedDependency[] = [],
  npmMetadata: Readonly<Record<string, DependencyHealthMetadata>> = {},
  generatedAt = new Date().toISOString(),
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
): DependencyHealthReport {
  const grouped = groupDependencies(dependencies, scopedDependencies);
  const items = grouped.map((group) => buildDependencyHealthItem(group, npmMetadata));
  const summary = buildDependencyHealthSummary(items);

  return {
    generatedAt,
    cacheTtlMs,
    ecosystemSupport: ECOSYSTEM_SUPPORT,
    items,
    summary,
  };
}

function groupDependencies(
  dependencies: readonly Dependency[],
  scopedDependencies: readonly ScopedDependency[],
): readonly DependencyGroup[] {
  const grouped = new Map<DependencyKey, DependencyGroup>();

  for (const dependency of dependencies) {
    const key = dependencyKey(dependency);
    const existing = grouped.get(key);
    if (existing) continue;

    grouped.set(key, {
      dependency,
      scopedDependencies: scopedDependencies.filter((scopedDependency) => dependencyKey(scopedDependency) === key),
    });
  }

  return [...grouped.values()].sort((left, right) => compareDependency(left.dependency, right.dependency));
}

function buildDependencyHealthItem(
  group: DependencyGroup,
  npmMetadata: Readonly<Record<string, DependencyHealthMetadata>>,
): DependencyHealthItem {
  const { dependency, scopedDependencies } = group;
  const key = dependencyKey(dependency);
  const manifestPaths = uniqueSorted(scopedDependencies.map((entry) => entry.manifestPath));
  const packageNames = uniqueSorted(scopedDependencies.flatMap((entry) => (entry.packageName ? [entry.packageName] : [])));

  if (dependency.ecosystem !== 'npm') {
    return {
      ecosystem: dependency.ecosystem,
      name: dependency.name,
      type: dependency.type,
      state: 'unsupported',
      manifestPaths,
      packageNames,
    };
  }

  const metadata = npmMetadata[key];
  const { state, currentVersion, latestVersion, error } = resolveNpmDependencyState(dependency, metadata);

  return {
    ecosystem: dependency.ecosystem,
    name: dependency.name,
    type: dependency.type,
    state,
    manifestPaths,
    packageNames,
    ...(currentVersion ? { currentVersion } : {}),
    ...(latestVersion ? { latestVersion } : {}),
    ...(metadata?.license ? { license: metadata.license } : {}),
    ...(metadata?.checkedAt ? { checkedAt: metadata.checkedAt } : {}),
    ...(error ? { error } : {}),
  };
}

function resolveNpmDependencyState(
  dependency: Dependency,
  metadata: DependencyHealthMetadata | undefined,
): { state: Exclude<DependencyHealthState, 'unsupported'>; currentVersion?: string; latestVersion?: string; error?: string } {
  if (!metadata) {
    return { state: 'unknown' };
  }

  if (metadata.status === 'error') {
    return {
      state: 'error',
      ...(metadata.error ? { error: metadata.error } : {}),
    };
  }

  if (metadata.status === 'unknown') {
    return { state: 'unknown' };
  }

  const currentVersion = normalizeVersionToken(metadata.currentVersion ?? dependency.version);
  const latestVersion = normalizeVersionToken(metadata.latestVersion);

  if (metadata.status === 'current') {
    return {
      state: 'current',
      ...(currentVersion ? { currentVersion } : {}),
      ...(latestVersion ? { latestVersion } : {}),
    };
  }

  if (metadata.status === 'outdated') {
    return {
      state: 'outdated',
      ...(currentVersion ? { currentVersion } : {}),
      ...(latestVersion ? { latestVersion } : {}),
    };
  }

  if (!currentVersion || !latestVersion) {
    return { state: 'unknown', ...(currentVersion ? { currentVersion } : {}), ...(latestVersion ? { latestVersion } : {}) };
  }

  const comparison = compareNormalizedVersions(currentVersion, latestVersion);
  return {
    state: comparison >= 0 ? 'current' : 'outdated',
    currentVersion,
    latestVersion,
  };
}

function buildDependencyHealthSummary(items: readonly DependencyHealthItem[]): DependencyHealthSummary {
  return {
    total: items.length,
    current: countByState(items, 'current'),
    outdated: countByState(items, 'outdated'),
    unknown: countByState(items, 'unknown'),
    errors: countByState(items, 'error'),
    unsupported: countByState(items, 'unsupported'),
  };
}

function countByState(items: readonly DependencyHealthItem[], state: DependencyHealthState): number {
  return items.filter((item) => item.state === state).length;
}

function dependencyKey(dependency: Dependency): DependencyKey {
  return `${dependency.ecosystem}:${dependency.name}:${dependency.version ?? ''}:${dependency.type}`;
}

function compareDependency(left: Dependency, right: Dependency): number {
  return left.ecosystem.localeCompare(right.ecosystem) || left.name.localeCompare(right.name) || (left.version ?? '').localeCompare(right.version ?? '') || left.type.localeCompare(right.type);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function normalizeVersionToken(version: string | undefined): string | undefined {
  if (!version) return undefined;

  const trimmed = version.trim();
  if (trimmed === '') return undefined;

  return trimmed
    .replace(/^v/, '')
    .replace(/^[~^<>]=?\s*/, '')
    .replace(/\s+$/, '');
}

function compareNormalizedVersions(left: string, right: string): number {
  const [leftRelease, leftPre] = left.split('-');
  const [rightRelease, rightPre] = right.split('-');

  const leftParts = leftRelease.split('.').map(parseVersionPart);
  const rightParts = rightRelease.split('.').map(parseVersionPart);
  const partCount = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < partCount; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart !== rightPart) return leftPart - rightPart;
  }

  if (!leftPre && rightPre) return 1;
  if (leftPre && !rightPre) return -1;
  if (!leftPre && !rightPre) return 0;

  const leftPreParts = leftPre.split('.');
  const rightPreParts = rightPre.split('.');
  const prePartCount = Math.max(leftPreParts.length, rightPreParts.length);

  for (let index = 0; index < prePartCount; index += 1) {
    const lp = leftPreParts[index];
    const rp = rightPreParts[index];

    if (lp === undefined && rp !== undefined) return -1;
    if (lp !== undefined && rp === undefined) return 1;

    const lpNum = Number.parseInt(lp, 10);
    const rpNum = Number.parseInt(rp, 10);
    const lpIsNum = Number.isInteger(lpNum) && String(lpNum) === lp;
    const rpIsNum = Number.isInteger(rpNum) && String(rpNum) === rp;

    if (lpIsNum && rpIsNum) {
      const diff = lpNum - rpNum;
      if (diff !== 0) return diff;
    } else if (lpIsNum && !rpIsNum) {
      return -1;
    } else if (!lpIsNum && rpIsNum) {
      return 1;
    } else {
      const cmp = lp.localeCompare(rp);
      if (cmp !== 0) return cmp;
    }
  }

  return 0;
}

function parseVersionPart(part: string): number {
  const parsed = Number.parseInt(part, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
