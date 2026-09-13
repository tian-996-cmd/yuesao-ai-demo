import assert from 'node:assert/strict';
import test from 'node:test';
import {
  customerUpdateInput,
  orderUpdateInput,
  scheduleUpdateInput,
  workerUpdateInput,
} from '../dist/validation.js';

void test('客户更新校验可以只解析局部字段且不注入默认值', () => {
  assert.deepEqual(customerUpdateInput.parse({ remark: '更新备注' }), {
    remark: '更新备注',
  });
});

void test('服务人员更新校验可以只解析局部字段且不注入默认值', () => {
  assert.deepEqual(workerUpdateInput.parse({ remark: '更新备注' }), {
    remark: '更新备注',
  });
});

void test('订单更新校验可以只解析局部字段且不注入默认值', () => {
  assert.deepEqual(orderUpdateInput.parse({ totalAmount: 6800 }), {
    totalAmount: 6800,
  });
});

void test('排期更新校验可以只解析局部字段且不注入默认值', () => {
  assert.deepEqual(scheduleUpdateInput.parse({ remark: '更新备注' }), {
    remark: '更新备注',
  });
});

void test('局部更新同时提供范围两端时仍校验顺序', () => {
  assert.equal(
    customerUpdateInput.safeParse({ budgetMin: 8000, budgetMax: 6000 }).success,
    false,
  );
  assert.equal(
    orderUpdateInput.safeParse({
      startDate: '2026-10-20',
      endDate: '2026-10-01',
    }).success,
    false,
  );
});
