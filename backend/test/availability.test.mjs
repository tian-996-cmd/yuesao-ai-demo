import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addCalendarDays,
  deriveAvailability,
} from '../dist/domain/availability.js';

const slot = (start, end, status = 'confirmed', sourceType = 'manual') => ({
  start,
  end,
  status,
  sourceType,
});

test('inclusive end date occupies the final day and releases the next day', () => {
  const schedules = [slot('2026-09-30', '2026-10-25')];
  assert.equal(
    deriveAvailability(schedules, '2026-10-25').currentAvailable,
    false,
  );
  assert.equal(
    deriveAvailability(schedules, '2026-10-25').nextAvailableDate,
    '2026-10-26',
  );
  assert.equal(
    deriveAvailability(schedules, '2026-10-26').currentAvailable,
    true,
  );
});

test('future locks do not change current availability but determine conservative long-term availability', () => {
  const value = deriveAvailability(
    [slot('2026-10-10', '2026-10-20'), slot('2026-11-01', '2026-11-10')],
    '2026-10-01',
  );
  assert.equal(value.currentAvailable, true);
  assert.equal(value.locked, true);
  assert.equal(value.nextAvailableDate, '2026-11-11');
});

test('continuous schedules and cancellation/completion are handled consistently', () => {
  const value = deriveAvailability(
    [
      slot('2026-10-01', '2026-10-10', 'confirmed', 'order'),
      slot('2026-10-11', '2026-10-25'),
      slot('2026-12-01', '2026-12-20', 'cancelled'),
      slot('2027-01-01', '2027-01-20', 'completed'),
    ],
    '2026-10-05',
  );
  assert.equal(value.inService, true);
  assert.equal(value.nextAvailableDate, '2026-10-26');
  assert.equal(addCalendarDays('2026-12-31', 1), '2027-01-01');
});
