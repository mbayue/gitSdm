import { expect, test } from 'bun:test';
import { isPublicAddress, fetchPublicChat } from './public-chat-fetch';

test('blocks local, private, reserved and mapped network addresses', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2002:7f00:1::', '2001:db8::1']) expect(isPublicAddress(address)).toBe(false);
  expect(isPublicAddress('8.8.8.8')).toBe(true);
  expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
});

test('rejects a private endpoint before sending a request', async () => {
  await expect(fetchPublicChat('https://127.0.0.1/v1')).rejects.toMatchObject({ code: 'INVALID_AI_CONFIG' });
});
