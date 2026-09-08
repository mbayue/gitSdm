import { expect, test } from 'bun:test';
import { isRepositoryPage } from './page-route';

test('repository routes support deep links without treating missing assets as pages', () => {
  for (const path of ['/mock/todo-app', '/mbayue/gitSdm/search', '/owner/repo/']) expect(isRepositoryPage(path)).toBe(true);
  for (const path of ['/missing', '/assets/missing.js', '/api/missing', '/owner/repo/unknown', '/a/b/c/d']) expect(isRepositoryPage(path)).toBe(false);
});
