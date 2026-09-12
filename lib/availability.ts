import type { MaternityNurse, NurseSchedule } from './nurse-types';
import { addDays } from './v3-engine';

export const isEffectiveSlot = (slot: NurseSchedule) =>
  !['cancelled', 'completed'].includes(slot.rawStatus ?? '') &&
  slot.status !== '空档';

export function availabilityFor(nurse: MaternityNurse, currentDate: string) {
  if (nurse.availability?.currentDate === currentDate)
    return nurse.availability;
  const effective = nurse.schedule.filter(isEffectiveSlot);
  const current = effective.filter(
    (slot) => slot.start <= currentDate && slot.end >= currentDate,
  );
  const relevant = effective.filter((slot) => slot.end >= currentDate);
  const latest = relevant.reduce<string | undefined>(
    (end, slot) => (!end || slot.end > end ? slot.end : end),
    undefined,
  );
  return {
    currentDate,
    currentAvailable: current.length === 0,
    inService: current.some(
      (slot) =>
        slot.sourceType === 'order' &&
        ['confirmed', 'in_service'].includes(slot.rawStatus ?? ''),
    ),
    locked: relevant.length > 0,
    nextAvailableDate: latest ? addDays(latest, 1) : currentDate,
  };
}

export const displayStatus = (nurse: MaternityNurse, currentDate: string) => {
  if (nurse.status === '不可接单') return '不可接单';
  const value = availabilityFor(nurse, currentDate);
  return value.inService
    ? '上户中'
    : value.currentAvailable
      ? '空档'
      : '已锁档';
};
