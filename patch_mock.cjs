const fs = require('fs');

const tsconfigPath = 'tsconfig.json';
if (fs.existsSync(tsconfigPath)) {
  console.log('tsconfig exists');
}

// These unhandled errors between tests are related to missing env variables / mock state leakage.
// Wait, when I ran 'bun test ./server/parser/dependency-analyzer.test.ts' it passed perfectly.
// The tests that are failing (fetch-tree, ai-service) are known to fail without env variables.
// In memory: "Server-side integration tests (e.g., testing `createEmbeddingProvider`, `buildGraph`, `github/fetch-tree`) require valid API keys (GitHub, AI providers) mapped in the `.env` file to pass. Failures in these tests can be safely ignored when working strictly on frontend UI components."
// But wait, buildGraph is failing, and I modified graph-builder.ts! Let's check why buildGraph tests are failing.
