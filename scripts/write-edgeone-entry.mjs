import { writeFileSync } from 'node:fs';

const target = process.argv[2];
if (!target) {
  console.error('usage: node write-edgeone-entry.mjs <entry.js>');
  process.exit(1);
}

writeFileSync(
  target,
  "import { handler } from './bundle.js';\n\nexport default function onRequest(context) {\n  return handler(context);\n}\n",
);
console.log('wrote thin entry:', target);