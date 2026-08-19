import { readFileSync, writeFileSync } from 'node:fs';

const target = process.argv[2];
if (!target) {
  console.error('usage: node postprocess-edgeone-bundle.mjs <bundle.js>');
  process.exit(1);
}

let src = readFileSync(target, 'utf8');

const dynamicImports = new Set(
  [...src.matchAll(/await\s+import\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
);
if (dynamicImports.size === 0) {
  console.log('no dynamic imports found — nothing to patch');
} else {
  for (const spec of dynamicImports) {
    const before = `await import("${spec}")`;
    const after = `await Promise.resolve(__require("${spec}"))`;
    if (!src.includes(before)) {
      console.error(`unexpected dynamic import form for "${spec}"`);
      process.exit(1);
    }
    src = src.split(before).join(after);
  }
  console.log('patched dynamic imports:', [...dynamicImports].join(', '));
}

writeFileSync(target, src);