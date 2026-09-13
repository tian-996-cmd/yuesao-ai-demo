import type { Customer, DemandProfile } from './types';
import type { MaternityNurse, NurseSchedule } from './nurse-types';

export const DEMO_TODAY = new Date(Date.UTC(2026, 8, 7));
const DAY = 86400000;
export const parseDay = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const formatShort = (value: string) => {
  const [y, m, d] = value.split('-');
  return `${Number(y)}年${Number(m)}月${Number(d)}日`;
};
export const addDays = (value: string, days: number) =>
  new Date(parseDay(value) + days * DAY).toISOString().slice(0, 10);
export const normalizeSchedule = (slot: NurseSchedule) => ({
  ...slot,
  startMs: parseDay(slot.start),
  endMs: parseDay(slot.end),
});
export type ScheduleConflict = {
  nurse: MaternityNurse;
  a: NurseSchedule;
  b: NurseSchedule;
  start: string;
  end: string;
};
export function detectScheduleConflicts(
  nurses: MaternityNurse[],
): ScheduleConflict[] {
  const out: ScheduleConflict[] = [];
  for (const nurse of nurses) {
    const slots = nurse.schedule
      .filter(
        (s) =>
          s.status !== '空档' &&
          !['cancelled', 'completed'].includes(s.rawStatus ?? ''),
      )
      .map(normalizeSchedule);
    for (let i = 0; i < slots.length; i++)
      for (let j = i + 1; j < slots.length; j++) {
        const startMs = Math.max(slots[i].startMs, slots[j].startMs);
        const endMs = Math.min(slots[i].endMs, slots[j].endMs);
        if (startMs <= endMs)
          out.push({
            nurse,
            a: slots[i],
            b: slots[j],
            start: new Date(startMs).toISOString().slice(0, 10),
            end: new Date(endMs).toISOString().slice(0, 10),
          });
      }
  }
  return out;
}
export function assignScheduleLanes(slots: NurseSchedule[]) {
  const sorted = [...slots].sort(
    (a, b) => parseDay(a.start) - parseDay(b.start),
  );
  const laneEnds: number[] = [];
  return sorted
    .map((slot) => {
      const start = parseDay(slot.start);
      let lane = laneEnds.findIndex((end) => end < start);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(parseDay(slot.end));
      } else laneEnds[lane] = parseDay(slot.end);
      return { slot, lane, laneCount: 0 };
    })
    .map((x) => ({ ...x, laneCount: laneEnds.length }));
}
export function parseDemand(note: string, customer?: Customer): DemandProfile {
  const twin = /双胞胎|双胎/.test(note);
  const preterm = /早产/.test(note);
  const must = ['新生儿护理'];
  if (/母乳/.test(note)) must.push('母乳喂养配合');
  if (/月子餐|做饭/.test(note)) must.push('月子餐');
  return {
    serviceTime:
      customer?.dueDate ?? (/11月底/.test(note) ? '2026-11-28' : '待确认'),
    budgetFlexibility: /贵一点|提高/.test(note)
      ? '合适可适当提高'
      : '按当前预算',
    familySituation: /婆婆/.test(note)
      ? '婆婆同住'
      : (customer?.family ?? '待确认'),
    mustHaves: must,
    preferences: [/温和/.test(note) ? '性格温和' : '沟通顺畅'],
    exclusions: /强势/.test(note) ? ['强势型'] : (customer?.exclusions ?? []),
    specialExperience: [
      ...(twin ? ['双胞胎'] : []),
      ...(preterm ? ['早产儿'] : []),
    ],
    questions: ['是否有月嫂年龄要求', '是否需要夜间重点护理'],
  };
}
export type MatchResult = {
  nurse: MaternityNurse;
  score: number;
  hard: { schedule: boolean; experience: boolean; budget: boolean };
  soft: { personality: number; cooking: number; reviews: number };
  reasons: string[];
  warnings: string[];
  excluded: boolean;
};
export function matchNurses(
  customer: Customer,
  nurses: MaternityNurse[],
): MatchResult[] {
  const start = parseDay(customer.dueDate),
    end = start + (customer.serviceDays - 1) * DAY;
  const profile =
    customer.demandProfile ?? parseDemand(customer.originalNote, customer);
  return nurses
    .map((nurse) => {
      const blocking = nurse.schedule.some(
        (s) =>
          s.status !== '空档' &&
          !['cancelled', 'completed'].includes(s.rawStatus ?? '') &&
          Math.max(start, parseDay(s.start)) <= Math.min(end, parseDay(s.end)),
      );
      const specialOk = profile.specialExperience.every((x) =>
        nurse.specialExperienceTags.includes(x),
      );
      const budget = nurse.price26Days <= customer.budgetMax + 2000;
      const personality = Math.min(
        98,
        70 +
          nurse.personalityTags.filter((x) =>
            profile.preferences.some((p) => p.includes(x)),
          ).length *
            12 +
          nurse.ratings.communication,
      );
      const cooking = Math.round(nurse.ratings.cooking * 10);
      const reviews = Math.round(nurse.ratings.overall * 20);
      let score = Math.round(
        (personality + cooking + reviews) / 3 + nurse.experienceYears * 0.6,
      );
      if (!budget) score -= 14;
      if (!specialOk) score -= 18;
      if (blocking) score -= 35;
      score = Math.max(35, Math.min(97, score));
      return {
        nurse,
        score,
        hard: { schedule: !blocking, experience: specialOk, budget },
        soft: { personality: Math.round(personality), cooking, reviews },
        reasons: [
          !blocking ? '服务日期可以完整覆盖' : '服务日期存在占用',
          `${nurse.experienceYears}年从业经验`,
          specialOk && profile.specialExperience.length
            ? '具备所需特殊护理经历'
            : '核心护理能力匹配',
          budget ? '报价符合客户预算' : '报价略高于客户预算',
        ],
        warnings: [
          ...(blocking ? ['档期与现有订单冲突，暂不可锁定'] : []),
          ...(nurse.personalityTags.includes('主见较强')
            ? ['工作方式较有主见，建议提前沟通边界']
            : []),
        ],
        excluded:
          blocking || (!specialOk && profile.specialExperience.length > 0),
      };
    })
    .sort((a, b) => b.score - a.score);
}
export function dashboardMetrics(
  customers: Customer[],
  nurses: MaternityNurse[],
  currentDate = DEMO_TODAY.toISOString().slice(0, 10),
) {
  const today = parseDay(currentDate),
    future = today + 90 * DAY;
  const slots = nurses
    .flatMap((n) => n.schedule)
    .filter(
      (s) =>
        s.status !== '空档' &&
        !['cancelled', 'completed'].includes(s.rawStatus ?? ''),
    );
  return {
    followups: customers.filter(
      (c) => !['已完成', '服务中'].includes(String(c.status)),
    ).length,
    matching: customers.filter(
      (c) => c.status === '待匹配' || c.status === '新客户',
    ).length,
    starting: slots.filter((s) => {
      const d = parseDay(s.start);
      return d >= today && d <= future;
    }).length,
    ending: slots.filter((s) => {
      const d = parseDay(s.end);
      return d >= today && d <= future;
    }).length,
    conflicts: detectScheduleConflicts(nurses).length,
  };
}
export function nurseGrade(n: MaternityNurse) {
  return (
    n.grade ??
    (n.experienceYears >= 9
      ? '金牌'
      : n.experienceYears >= 6
        ? '资深'
        : n.experienceYears >= 3
          ? '高级'
          : '专业')
  );
}
