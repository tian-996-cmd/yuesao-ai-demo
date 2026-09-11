import assert from 'node:assert/strict';
import test from 'node:test';
import { rangesOverlap } from '../dist/domain/schedule.js';

const range = (start, end) => ({
  start: new Date(`${start}T00:00:00+08:00`),
  end: new Date(`${end}T23:59:59+08:00`),
});
test('识别排期时间重叠', () =>
  assert.equal(
    rangesOverlap(
      range('2026-10-01', '2026-10-20'),
      range('2026-10-10', '2026-10-30'),
    ),
    true,
  ));
test('不同时间段不冲突', () =>
  assert.equal(
    rangesOverlap(
      range('2026-10-01', '2026-10-20'),
      range('2026-10-21', '2026-10-30'),
    ),
    false,
  ));
test('同一天边界按占用处理', () =>
  assert.equal(
    rangesOverlap(
      range('2026-10-01', '2026-10-20'),
      range('2026-10-20', '2026-10-25'),
    ),
    true,
  ));
