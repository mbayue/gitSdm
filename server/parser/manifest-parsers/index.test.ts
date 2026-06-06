import { describe, it, expect } from 'bun:test';
import {
  parsePackageJson,
  parseGoMod,
  parseManifest,
  parseRequirementsTxt,
  parsePyproject,
  parseCargoToml,
  parseDockerfile,
  parsePomXml,
} from './index';

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
  });

  it('parses go.mod require block', () => {
    const deps = parseGoMod(`module example.com/app\n\nrequire (\n\tgithub.com/foo/bar v1.2.3\n)\n`);
    expect(deps.some((d) => d.name === 'github.com/foo/bar')).toBe(true);
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
});
