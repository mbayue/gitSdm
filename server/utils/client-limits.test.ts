import { afterEach, expect, test } from 'bun:test';
import { limitClient, resolveClientAddress } from './client-limits';

const originalProxy = process.env.TRUSTED_PROXY_IPS;
test('mapped IPv6 spellings share the IPv4 identity and trusted proxy matching', () => {
  process.env.TRUSTED_PROXY_IPS = '127.0.0.1';
  for (const peer of ['::ffff:7f00:1', '0:0:0:0:0:ffff:7f00:1', '::ffff:127.0.0.1']) {
    expect(resolveClientAddress(new Headers(), peer)).toBe('127.0.0.1');
    expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '1.2.3.4' }), peer)).toBe('1.2.3.4');
  }
});
const originalLimit = process.env.API_REQUESTS_PER_IP_PER_MINUTE;
afterEach(() => {
  if (originalProxy === undefined) delete process.env.TRUSTED_PROXY_IPS;
  else process.env.TRUSTED_PROXY_IPS = originalProxy;
  if (originalLimit === undefined) delete process.env.API_REQUESTS_PER_IP_PER_MINUTE;
  else process.env.API_REQUESTS_PER_IP_PER_MINUTE = originalLimit;
});

test('untrusted connections cannot spoof client identity', () => {
  delete process.env.TRUSTED_PROXY_IPS;
  expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '1.2.3.4' }), '::ffff:192.0.2.1')).toBe('192.0.2.1');
  expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '1.2.3.4' }))).toBe('unknown');
});

test('trusted chain stops at nearest untrusted hop and rejects malformed addresses', () => {
  process.env.TRUSTED_PROXY_IPS = '127.0.0.1, ::1';
  expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '1.2.3.4, 192.0.2.2, ::1' }), '127.0.0.1')).toBe('192.0.2.2');
  expect(resolveClientAddress(new Headers({ 'x-forwarded-for': 'invalid' }), '127.0.0.1')).toBe('127.0.0.1');
  expect(resolveClientAddress(new Headers(), '2001:0db8:0:0:0:0:0:1')).toBe('2001:db8::1');
});

test('hex and octal IPv4 forms canonicalize to the same bucket as dotted decimal', () => {
  delete process.env.TRUSTED_PROXY_IPS;
  expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '0x7f.0.0.1' }), '9.9.9.9')).toBe('9.9.9.9');
  process.env.TRUSTED_PROXY_IPS = '9.9.9.9';
  expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '0x7f.0.0.1' }), '9.9.9.9')).toBe('127.0.0.1');
  expect(resolveClientAddress(new Headers({ 'x-forwarded-for': '0177.0.0.1' }), '9.9.9.9')).toBe('127.0.0.1');
});

test('hex and octal IPv4-mapped IPv6 forms canonicalize from the 32-bit payload', () => {
  delete process.env.TRUSTED_PROXY_IPS;
  expect(resolveClientAddress(new Headers(), '::ffff:0x7f.0.0.1')).toBe('127.0.0.1');
  expect(resolveClientAddress(new Headers(), '::ffff:0177.0.0.1')).toBe('127.0.0.1');
  expect(resolveClientAddress(new Headers(), '::ffff:0x7f000001')).toBe('127.0.0.1');
  expect(resolveClientAddress(new Headers(), '::ffff:2130706433')).toBe('127.0.0.1');
  expect(resolveClientAddress(new Headers(), '::ffff:garbage')).toBe('unknown');
});

test('same IP shares quota regardless of credentials while other IP has its own allowance', async () => {
  process.env.API_REQUESTS_PER_IP_PER_MINUTE = '1';
  await limitClient(new Headers(), '192.0.2.110');
  await expect(limitClient(new Headers({ 'x-gemini-api-key': 'user-key', 'x-github-token': 'pat' }), '192.0.2.110')).rejects.toMatchObject({ status: 429 });
  await limitClient(new Headers(), '192.0.2.111');
});
