import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../dist/security/password.js';

test('密码使用带随机盐的 scrypt 哈希', async () => {
  const first = await hashPassword('demo2026');
  const second = await hashPassword('demo2026');
  assert.notEqual(first, second);
  assert.equal(first.includes('demo2026'), false);
  assert.equal(await verifyPassword('demo2026', first), true);
  assert.equal(await verifyPassword('wrong-password', first), false);
});
