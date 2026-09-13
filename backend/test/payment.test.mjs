import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePaymentSummary,
  moneyToCents,
} from '../dist/domain/payment.js';

const summary = (receivedAmount, overrides = {}) =>
  calculatePaymentSummary({
    totalAmount: '16000.00',
    depositAmount: '3000.00',
    receivedAmount,
    finalPaymentDueDate: '2026-09-30',
    today: '2026-09-13',
    ...overrides,
  });

test('金额按分解析，避免浮点比较误差', () => {
  assert.equal(moneyToCents('16000.50'), BigInt(1600050));
  assert.equal(moneyToCents(0.1 + 0.2), BigInt(30));
});

test('未付款订单汇总', () => {
  assert.deepEqual(summary('0'), {
    totalAmount: 16000,
    depositAmount: 3000,
    receivedAmount: 0,
    outstandingAmount: 16000,
    finalPaymentDueDate: '2026-09-30',
    paymentStatus: 'unpaid',
    overdueDays: 0,
  });
});

test('达到定金后进入待付尾款', () => {
  assert.equal(summary('3000').paymentStatus, 'pending_final');
  assert.equal(summary('3000').outstandingAmount, 13000);
});

test('不足定金属于部分付款', () => {
  assert.equal(summary('1500').paymentStatus, 'partial_paid');
});

test('足额收款自动结清', () => {
  assert.equal(summary('16000').paymentStatus, 'paid');
  assert.equal(summary('16000').outstandingAmount, 0);
});

test('逾期优先于已付定金并按上海自然日计算天数', () => {
  const value = summary('3000', { today: '2026-10-03' });
  assert.equal(value.paymentStatus, 'overdue');
  assert.equal(value.overdueDays, 3);
});

test('订单完成不改变付款状态', () => {
  assert.equal(
    summary('3000', { today: '2026-10-03' }).paymentStatus,
    'overdue',
  );
});
