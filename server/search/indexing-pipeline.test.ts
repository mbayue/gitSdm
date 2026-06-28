import { test, expect } from 'bun:test';
import { createIndexingPipeline } from './indexing-pipeline';

// A simple smoke test file
test('indexing-pipeline exists', () => {
  const pipeline = createIndexingPipeline();
  expect(pipeline).toBeDefined();
});
