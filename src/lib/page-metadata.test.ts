import { expect, test } from 'bun:test';
import { pageMetadata } from './page-metadata';
test('valid navigation clears 404 robots and privacy canonical metadata', () => {
  expect(pageMetadata('/missing').robots).toBe('noindex');
  expect(pageMetadata('/').robots).toBe('index, follow');
  expect(pageMetadata('/privacy').canonical).toBe('https://gsdm.site/privacy');
  expect(pageMetadata('/').canonical).toBe('https://gsdm.site/');
  expect(pageMetadata('/mock/todo-app').canonical).toBeUndefined();
});

test('terms metadata supports direct and trailing-slash navigation', () => {
  for (const path of ['/terms', '/terms/']) {
    expect(pageMetadata(path).title).toBe('Terms of use — gitSdm');
    expect(pageMetadata(path).canonical).toBe('https://gsdm.site/terms');
    expect(pageMetadata(path).robots).toBe('index, follow');
  }
});
