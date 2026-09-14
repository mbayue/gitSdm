import { test, expect } from 'bun:test';
import { isSafeRemoteUrl, expandIpv6Groups } from './url-guard';

test('allows public https and http remotes', () => {
  expect(isSafeRemoteUrl('https://api.upstash.com/v2')).toBe(true);
  expect(isSafeRemoteUrl('http://example.com')).toBe(true);
  expect(isSafeRemoteUrl('https://169.63.10.1')).toBe(true);
  expect(isSafeRemoteUrl('https://8.8.8.8')).toBe(true);
  expect(isSafeRemoteUrl('https://192.0.1.5')).toBe(true);
  expect(isSafeRemoteUrl('https://100.128.0.1')).toBe(true);
  expect(isSafeRemoteUrl('https://172.32.1.1')).toBe(true);
  expect(isSafeRemoteUrl('https://198.51.200.1')).toBe(true);
  expect(isSafeRemoteUrl('https://203.0.114.1')).toBe(true);
  expect(isSafeRemoteUrl('https://[2606:4700::1]/v2')).toBe(true);
  expect(isSafeRemoteUrl('https://[64:ff9b::102:304]/v2')).toBe(true);
  expect(isSafeRemoteUrl('https://[2002:100:2::]/v2')).toBe(true);
});

test('rejects non-http schemes and malformed urls', () => {
  expect(isSafeRemoteUrl('ftp://example.com')).toBe(false);
  expect(isSafeRemoteUrl('file:///etc/passwd')).toBe(false);
  expect(isSafeRemoteUrl('not a url')).toBe(false);
  expect(isSafeRemoteUrl('')).toBe(false);
});

test('rejects loopback, private, link-local, and reserved hosts', () => {
  expect(isSafeRemoteUrl('https://localhost')).toBe(false);
  expect(isSafeRemoteUrl('https://api.localhost')).toBe(false);
  expect(isSafeRemoteUrl('https://127.0.0.1')).toBe(false);
  expect(isSafeRemoteUrl('https://10.1.2.3')).toBe(false);
  expect(isSafeRemoteUrl('https://172.16.0.9')).toBe(false);
  expect(isSafeRemoteUrl('https://172.31.255.1')).toBe(false);
  expect(isSafeRemoteUrl('https://192.168.1.1')).toBe(false);
  expect(isSafeRemoteUrl('https://169.254.169.254')).toBe(false);
  expect(isSafeRemoteUrl('https://0.0.0.0')).toBe(false);
  expect(isSafeRemoteUrl('https://100.100.1.1')).toBe(false);
  expect(isSafeRemoteUrl('https://224.0.0.1')).toBe(false);
  expect(isSafeRemoteUrl('https://192.0.2.1')).toBe(false);
  expect(isSafeRemoteUrl('https://198.51.100.7')).toBe(false);
  expect(isSafeRemoteUrl('https://203.0.113.7')).toBe(false);
  expect(isSafeRemoteUrl('https://192.0.0.1')).toBe(false);
  expect(isSafeRemoteUrl('https://[64:ff9b::127.0.0.1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[64:ff9b::7f00:1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[2002:7f00:1::]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[2002::ac10:1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[64:ff9b::]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[2002::]/v2')).toBe(false);
  // Transition-prefix precision pins: NAT64 /96 decodes only the well-known form.
  expect(isSafeRemoteUrl('https://[64:ff9b:1::7f00:1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[64:ff9b:1::102:304]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[64:ff9b:1::801:8]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[64:ff9b:0:0:0:1:102:304]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[::1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[::]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[::ffff:127.0.0.1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[::ffff:7f00:1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[::127.0.0.1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[::10.0.0.1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[fc00::1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[fe80::1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[fe80::1%25eth0]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[ff02::1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://[2001:db8::1]/v2')).toBe(false);
  expect(isSafeRemoteUrl('https://redis.internal')).toBe(false);
  expect(isSafeRemoteUrl('https://box.local')).toBe(false);
  expect(isSafeRemoteUrl('https://internal')).toBe(false);
  expect(isSafeRemoteUrl('https://local')).toBe(false);
});

test('canonicalization tricks resolve to the checked hostname', () => {
  expect(isSafeRemoteUrl('https://0x7f.0.0.1')).toBe(false);
  expect(isSafeRemoteUrl('https://0177.0.0.1')).toBe(false);
  expect(isSafeRemoteUrl('https://2130706433')).toBe(false);
  expect(isSafeRemoteUrl('https://user@127.0.0.1/')).toBe(false);
  expect(isSafeRemoteUrl('https://127.0.0.1./v2')).toBe(false);
  // Octal tricks are neutralized by the URL parser itself (010.0.0.1 -> 8.0.0.1, public).
  expect(isSafeRemoteUrl('https://010.0.0.1')).toBe(true);
});

test('expandIpv6Groups expands and validates canonical and compressed IPv6 forms', () => {
  // Rejects compressed forms with zero-length runs (missing <= 0)
  expect(expandIpv6Groups('1:2:3:4:5:6:7:8::')).toEqual([]);
  expect(expandIpv6Groups('::1:2:3:4:5:6:7:8')).toEqual([]);
  expect(expandIpv6Groups('1:2:3:4::5:6:7:8')).toEqual([]);
  expect(expandIpv6Groups('1:2:3:4::5:6:7:8:9')).toEqual([]);

  // Rejects malformed or out-of-range hex groups
  expect(expandIpv6Groups('2002:12345::1')).toEqual([]);
  expect(expandIpv6Groups('2002:12g4::1')).toEqual([]);
  expect(expandIpv6Groups('2002:-1::1')).toEqual([]);
  expect(expandIpv6Groups('1:::2')).toEqual([]);
  expect(expandIpv6Groups('1::2:')).toEqual([]);
  expect(expandIpv6Groups(':1::2')).toEqual([]);

  // Valid forms
  expect(expandIpv6Groups('1:2:3:4:5:6:7:8')).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  expect(expandIpv6Groups('2002::1')).toEqual([0x2002, 0, 0, 0, 0, 0, 0, 1]);
  expect(expandIpv6Groups('2606:4700::1')).toEqual([0x2606, 0x4700, 0, 0, 0, 0, 0, 1]);
  expect(expandIpv6Groups('::')).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  expect(expandIpv6Groups('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
});
