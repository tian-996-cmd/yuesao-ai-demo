import assert from 'node:assert/strict';
import test from 'node:test';
import { databaseErrorCode } from '../dist/errors.js';

void test('可从 Drizzle 包装错误中提取 PostgreSQL 错误码', () => {
  const databaseError = Object.assign(new Error('exclusion violation'), {
    code: '23P01',
  });
  const wrapped = new Error('query failed', { cause: databaseError });

  assert.equal(databaseErrorCode(wrapped), '23P01');
  assert.equal(databaseErrorCode(databaseError), '23P01');
  assert.equal(databaseErrorCode(new Error('unknown')), undefined);
});
