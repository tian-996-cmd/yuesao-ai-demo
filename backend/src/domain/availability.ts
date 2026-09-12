export type AvailabilitySchedule = {
  start: string;
  end: string;
  status: string;
  sourceType: 'order' | 'manual';
};

const NON_OCCUPYING = new Set(['cancelled', 'completed']);

export function shanghaiToday(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addCalendarDays(day: string, amount: number) {
  const value = new Date(`${day}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function isEffectiveSchedule(schedule: AvailabilitySchedule) {
  return !NON_OCCUPYING.has(schedule.status);
}

export function deriveAvailability(
  schedules: AvailabilitySchedule[],
  currentDate = shanghaiToday(),
) {
  const effective = schedules.filter(isEffectiveSchedule);
  const current = effective.filter(
    (item) => item.start <= currentDate && item.end >= currentDate,
  );
  const relevant = effective.filter((item) => item.end >= currentDate);
  const latestEnd = relevant.reduce<string | undefined>(
    (latest, item) => (!latest || item.end > latest ? item.end : latest),
    undefined,
  );
  return {
    currentDate,
    currentAvailable: current.length === 0,
    inService: current.some(
      (item) =>
        item.sourceType === 'order' &&
        (item.status === 'confirmed' || item.status === 'in_service'),
    ),
    locked: relevant.length > 0,
    nextAvailableDate: latestEnd ? addCalendarDays(latestEnd, 1) : currentDate,
  };
}
