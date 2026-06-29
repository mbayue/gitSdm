import { describe, it, expect } from 'bun:test';
import {
  detectWorkspaceManifest,
  parsePackageJson,
  parsePnpmWorkspace,
  parseGoMod,
  parseManifest,
  parseRequirementsTxt,
  parsePyproject,
  parseCargoToml,
  parseDockerfile,
  parsePomXml,
} from './index';
import { getParserForFile, parserRegistry } from './registry';

describe('manifest parsers', () => {
  it('parses package.json dependencies', () => {
    const deps = parsePackageJson(
      JSON.stringify({
        dependencies: { react: '^19.0.0' },
        devDependencies: { vite: '^6.0.0' },
      }),
    );
    expect(deps).toHaveLength(2);
    expect(deps.find((d) => d.name === 'react')?.type).toBe('prod');
    expect(deps.find((d) => d.name === 'vite')?.type).toBe('dev');
  });

  it('handles invalid package.json gracefully', () => {
    const deps = parsePackageJson('corrupted-json-payload-string-invalid');
    expect(deps).toEqual([]);

    const originalParse = JSON.parse;
    JSON.parse = (() => {
      throw new Error('non-syntax JSON failure');
    }) as typeof JSON.parse;
    try {
      expect(() => parsePackageJson('{}')).toThrow('non-syntax JSON failure');
    } finally {
      JSON.parse = originalParse;
    }
  });

  it('parses peerDependencies from package.json', () => {
    const deps = parsePackageJson(
      JSON.stringify({
        dependencies: { react: '^19.0.0' },
        peerDependencies: { 'react-dom': '^19.0.0' },
      }),
    );
    expect(deps).toHaveLength(2);
    expect(deps.find((d) => d.name === 'react-dom')?.type).toBe('peer');
  });

  it('detects npm workspaces array from package.json', () => {
    // Given: root package.json with npm workspaces array
    const content = JSON.stringify({ workspaces: ['packages/*', 'apps/web'] });

    // When: workspace metadata is parsed
    const workspace = detectWorkspaceManifest('package.json', content);

    // Then: npm workspace package globs are preserved
    expect(workspace).toEqual({
      ecosystem: 'javascript',
      manager: 'npm',
      manifestPath: 'package.json',
      packageGlobs: ['packages/*', 'apps/web'],
    });
  });

  it('detects Yarn workspaces object from package.json', () => {
    // Given: root package.json with Yarn workspaces object
    const content = JSON.stringify({ workspaces: { packages: ['packages/*'] } });

    // When: workspace metadata is parsed
    const workspace = detectWorkspaceManifest('package.json', content);

    // Then: Yarn workspace package globs are preserved
    expect(workspace).toEqual({
      ecosystem: 'javascript',
      manager: 'yarn',
      manifestPath: 'package.json',
      packageGlobs: ['packages/*'],
    });
  });

  it('detects Bun workspaces from package.json packageManager', () => {
    // Given: package.json declares Bun as manager and workspaces array
    const content = JSON.stringify({ packageManager: 'bun@1.3.14', workspaces: ['packages/*'] });

    // When: workspace metadata is parsed
    const workspace = detectWorkspaceManifest('package.json', content);

    // Then: Bun manager is reported for JavaScript workspace contract
    expect(workspace).toEqual({
      ecosystem: 'javascript',
      manager: 'bun',
      manifestPath: 'package.json',
      packageGlobs: ['packages/*'],
    });
  });

  it('detects pnpm workspace package list', () => {
    // Given: pnpm-workspace.yaml with packages list plus unrelated top-level YAML
    const content = `packages:\n  - "packages/*"\n  - apps/web\nignored: true\n`;

    // When: workspace metadata is parsed
    const workspace = parsePnpmWorkspace('pnpm-workspace.yaml', content);

    // Then: pnpm package globs are preserved
    expect(workspace).toEqual({
      ecosystem: 'javascript',
      manager: 'pnpm',
      manifestPath: 'pnpm-workspace.yaml',
      packageGlobs: ['packages/*', 'apps/web'],
    });
  });

  it('handles malformed workspace manifests gracefully', () => {
    // Given: corrupt JSON and malformed pnpm YAML inputs
    const corruptJson = '{"workspaces": [';
    const malformedYaml = 'packages:\n  - ok\n    bad-indent';

    // When: workspace metadata is parsed
    const packageWorkspace = detectWorkspaceManifest('package.json', corruptJson);
    const pnpmWorkspace = parsePnpmWorkspace('pnpm-workspace.yaml', malformedYaml);

    // Then: parser returns null instead of throwing
    expect(packageWorkspace).toBeNull();
    expect(pnpmWorkspace).toBeNull();
  });

  it('parses go.mod require block', () => {
    const deps = parseGoMod(`module example.com/app\n\nrequire (\n\tgithub.com/foo/bar v1.2.3\n)\n`);
    expect(deps.some((d) => d.name === 'github.com/foo/bar')).toBe(true);
  });

  it('parses inline go.mod require entries', () => {
    const deps = parseGoMod(`module example.com/app\n\nrequire github.com/inline/pkg v2.0.0\n`);
    expect(deps).toContainEqual({
      name: 'github.com/inline/pkg',
      version: 'v2.0.0',
      type: 'prod',
      ecosystem: 'go',
    });
  });

  it('handles empty go.mod input gracefully', () => {
    const deps = parseGoMod('');
    expect(deps).toEqual([]);
  });

  it('parses requirements.txt dependencies', () => {
    const content = `flask>=2.0.0\nrequests==2.28.1\n# some comment\nnumpy\n`;
    const deps = parseRequirementsTxt(content);
    expect(deps).toHaveLength(3);
    expect(deps[0]).toEqual({ name: 'flask', version: '2.0.0', type: 'prod', ecosystem: 'python' });
    expect(deps[1]).toEqual({ name: 'requests', version: '2.28.1', type: 'prod', ecosystem: 'python' });
    expect(deps[2].name).toBe('numpy');
  });

  it('parses pyproject.toml dependencies', () => {
    const content = `[project.dependencies]\n"django>=4.0"\n"pandas"\n`;
    const deps = parsePyproject(content);
    expect(deps).toHaveLength(2);
    expect(deps[0].name).toBe('django');
    expect(deps[0].version).toBe('4.0');
    expect(deps[1].name).toBe('pandas');
  });

  it('parses Cargo.toml dependencies', () => {
    const content = `[dependencies]\ntokio = "1.28.0"\nserde = { version = "1.0", features = ["derive"] }\n`;
    const deps = parseCargoToml(content);
    expect(deps).toHaveLength(2);
    expect(deps.find((d) => d.name === 'tokio')?.version).toBe('1.28.0');
    expect(deps.find((d) => d.name === 'serde')?.version).toBe('1.0');
  });

  it('handles corrupted Cargo.toml gracefully', () => {
    const deps = parseCargoToml('invalid toml layout dependency string with no key-value structure');
    expect(deps).toEqual([]);
  });

  it('parses Cargo.toml plain version without quotes', () => {
    const content = `[dependencies]\nserde = 1.0\n`;
    const deps = parseCargoToml(content);
    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('serde');
    expect(deps[0].version).toBe('1.0');
  });

  it('parses Dockerfile base images', () => {
    const content = `FROM node:18-alpine AS builder\nWORKDIR /app\nFROM alpine:latest\n`;
    const deps = parseDockerfile(content);
    expect(deps).toHaveLength(2);
    expect(deps[0].name).toBe('node:18-alpine');
    expect(deps[1].name).toBe('alpine:latest');
  });

  it('parses pom.xml dependencies', () => {
    const content = `<dependency>\n<groupId>org.springframework</groupId>\n<artifactId>spring-core</artifactId>\n</dependency>\n`;
    const deps = parsePomXml(content);
    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe('spring-core');
    expect(deps[0].ecosystem).toBe('java');
  });

  it('routes by filename', () => {
    const deps = parseManifest('package.json', '{"dependencies":{"lodash":"^4.0.0"}}');
    expect(deps[0]?.ecosystem).toBe('npm');
  });

  it('returns empty array when no route parser matches file', () => {
    const deps = parseManifest('README.md', '# Readme Content');
    expect(deps).toEqual([]);
  });

  it('routes custom regex manifest parser registrations', () => {
    parserRegistry.set('regex-test', {
      name: 'regex-test',
      filePattern: /^custom\.(json|toml)$/,
      parse: () => [{ name: 'custom-dep', type: 'prod', ecosystem: 'custom' }],
    });

    expect(getParserForFile('nested/custom.toml')?.name).toBe('regex-test');
    expect(parseManifest('custom.json', '').at(0)?.name).toBe('custom-dep');
    // RegExp pattern should not match unrelated files (covers RegExp fall-through)
    expect(getParserForFile('other/unrelated.yaml')).toBeNull();

    parserRegistry.delete('regex-test');
  });

  it('returns null from getParserForFile for unmatched files', () => {
    expect(getParserForFile('unknown-file.xyz')).toBeNull();
  });
});
