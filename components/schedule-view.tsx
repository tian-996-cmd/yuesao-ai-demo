'use client';

import { AlertTriangle, CalendarClock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MediaAsset } from '@/lib/media-types';
import type {
  MaternityNurse,
  NurseSchedule,
  NurseStatus,
} from '@/lib/nurse-types';
import type { Customer } from '@/lib/types';
import { scheduleStyles } from '@/lib/nurse-constants';
import {
  availabilityFor,
  displayStatus,
  isEffectiveSlot,
} from '@/lib/availability';
import {
  addDays,
  assignScheduleLanes,
  detectScheduleConflicts,
  formatShort,
  parseDay,
} from '@/lib/v3-engine';
import { NurseAvatar } from './nurse-avatar';
import { NurseStatusBadge } from './nurse-status-badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

type Range = '本月' | '下月' | '未来90天';
const monthRange = (day: string, offset: number): [string, string] => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset, 1);
  const from = date.toISOString().slice(0, 10);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return [from, date.toISOString().slice(0, 10)];
};
const rangesFor = (day: string): Record<Range, [string, string]> => ({
  本月: monthRange(day, 0),
  下月: monthRange(day, 1),
  未来90天: [day, addDays(day, 89)],
});

export function ScheduleView({
  nurses,
  customers,
  media,
  currentDate,
  focusNurseId,
  onOpenNurse,
  onOpenCustomer,
}: {
  nurses: MaternityNurse[];
  customers: Customer[];
  media: MediaAsset[];
  currentDate: string;
  focusNurseId?: string;
  onOpenNurse: (id: string) => void;
  onOpenCustomer: (id: string) => void;
}) {
  const [range, setRange] = useState<Range>('未来90天');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'全部' | NurseStatus>('全部');
  const [selected, setSelected] = useState<{
    nurse: MaternityNurse;
    slot: NurseSchedule;
  } | null>(null);
  const conflicts = useMemo(() => detectScheduleConflicts(nurses), [nurses]);
  const list = nurses
    .filter(
      (nurse) =>
        (!query.trim() || nurse.name.includes(query.trim())) &&
        (status === '全部' || displayStatus(nurse, currentDate) === status),
    )
    .slice(0, 16);
  const [from, to] = rangesFor(currentDate)[range];
  const start = parseDay(from),
    end = parseDay(to),
    span = end - start;
  const stats = [
    [
      '空档',
      nurses.filter(
        (nurse) => availabilityFor(nurse, currentDate).currentAvailable,
      ).length,
    ],
    [
      '已锁档',
      nurses.filter((nurse) => availabilityFor(nurse, currentDate).locked)
        .length,
    ],
    [
      '上户中',
      nurses.filter((nurse) => availabilityFor(nurse, currentDate).inService)
        .length,
    ],
    ['冲突', conflicts.length],
  ];
  const selectedConflict =
    selected &&
    conflicts.find(
      (item) =>
        item.a.id === selected.slot.id || item.b.id === selected.slot.id,
    );

  return (
    <div className="page-stack resource-center">
      <div className="page-heading">
        <div>
          <div className="eyebrow">资源排期中心</div>
          <h1>档期中心</h1>
          <p>按真实日期查看人员占用、空档和重叠风险。</p>
        </div>
        <Button variant="outline" onClick={() => setRange('未来90天')}>
          <CalendarClock />
          今天 {formatShort(currentDate)}
        </Button>
      </div>
      <div className="schedule-top">
        <div className="schedule-mini-stats">
          {stats.map(([label, value]) => (
            <span key={label}>
              <b>{value}</b>
              {label}
            </span>
          ))}
        </div>
        <div className="schedule-toolbar">
          <div className="filter-tabs">
            {(['本月', '下月', '未来90天'] as Range[]).map((item) => (
              <button
                className={range === item ? 'active' : ''}
                key={item}
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="search-box">
            <Search />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索月嫂姓名"
            />
          </div>
          <div className="filter-tabs">
            {(['全部', '空档', '已锁档', '上户中'] as const).map((item) => (
              <button
                className={status === item ? 'active' : ''}
                key={item}
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      {conflicts.length > 0 && (
        <button
          className="conflict-strip"
          onClick={() => {
            const conflict = conflicts[0];
            setSelected({ nurse: conflict.nurse, slot: conflict.a });
          }}
        >
          <AlertTriangle />
          <strong>{conflicts.length} 处档期冲突</strong>
          <span>
            {conflicts[0].nurse.name} · 实际重叠{' '}
            {formatShort(conflicts[0].start)}–{formatShort(conflicts[0].end)}
          </span>
        </button>
      )}
      <section className="timeline-center">
        <div className="timeline-header">
          <span>月嫂资源</span>
          <div>
            <b>{formatShort(from)}</b>
            <b>{formatShort(to)}</b>
          </div>
        </div>
        {list.map((nurse) => {
          const lanes = assignScheduleLanes(
            nurse.schedule.filter(
              (slot) =>
                isEffectiveSlot(slot) &&
                parseDay(slot.end) >= start &&
                parseDay(slot.start) <= end,
            ),
          );
          const laneCount = Math.max(1, ...lanes.map((item) => item.laneCount));
          return (
            <div
              className={`resource-row ${focusNurseId === nurse.id ? 'focused' : ''}`}
              style={{ minHeight: Math.max(58, 28 + laneCount * 34) }}
              key={nurse.id}
            >
              <button
                className="resource-person"
                onClick={() => onOpenNurse(nurse.id)}
              >
                <NurseAvatar
                  nurseId={nurse.id}
                  name={nurse.name}
                  media={media}
                />
                <span>
                  <strong>{nurse.name}</strong>
                  <NurseStatusBadge
                    status={displayStatus(nurse, currentDate)}
                  />
                </span>
              </button>
              <div className="date-track">
                {lanes.map(({ slot, lane }) => {
                  const left = Math.max(
                    0,
                    ((Math.max(parseDay(slot.start), start) - start) / span) *
                      100,
                  );
                  const right = Math.min(
                    100,
                    ((Math.min(parseDay(slot.end), end) - start) / span) * 100,
                  );
                  const conflict = conflicts.some(
                    (item) => item.a.id === slot.id || item.b.id === slot.id,
                  );
                  return (
                    <button
                      key={slot.id}
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(3, right - left)}%`,
                        top: 8 + lane * 34,
                      }}
                      className={`date-block ${scheduleStyles[slot.status]} ${conflict ? 'conflicted' : ''}`}
                      onClick={() => setSelected({ nurse, slot })}
                    >
                      <strong>{slot.status}</strong>
                      <small>
                        {formatShort(slot.start)}–{formatShort(slot.end)}
                      </small>
                      {conflict && <i>冲突</i>}
                    </button>
                  );
                })}
                {parseDay(currentDate) >= start &&
                  parseDay(currentDate) <= end && (
                    <span
                      className="today-line"
                      style={{
                        left: `${((parseDay(currentDate) - start) / span) * 100}%`,
                      }}
                    />
                  )}
              </div>
            </div>
          );
        })}
      </section>
      <section className="mobile-schedule-v3">
        {list.slice(0, 8).map((nurse) => (
          <article key={nurse.id}>
            <header>
              <span>
                <NurseAvatar
                  nurseId={nurse.id}
                  name={nurse.name}
                  media={media}
                />
                <span>
                  <b>{nurse.name}</b>
                  <NurseStatusBadge
                    status={displayStatus(nurse, currentDate)}
                  />
                </span>
              </span>
              <button onClick={() => onOpenNurse(nurse.id)}>查看资料</button>
            </header>
            {nurse.schedule.filter(isEffectiveSlot).map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelected({ nurse, slot })}
              >
                <span>
                  {formatShort(slot.start)}–{formatShort(slot.end)}
                </span>
                <b className={scheduleStyles[slot.status]}>{slot.status}</b>
              </button>
            ))}
          </article>
        ))}
      </section>
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="slot-sheet">
          <SheetHeader>
            <div className="eyebrow">档期详情</div>
            <SheetTitle>{selected?.nurse.name}</SheetTitle>
            <SheetDescription>资源占用记录与关联客户</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="slot-detail">
              <dl>
                <div>
                  <dt>月嫂</dt>
                  <dd>{selected.nurse.name}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selected.slot.customerName ?? '未关联'}</dd>
                </div>
                <div>
                  <dt>服务地区</dt>
                  <dd>{selected.slot.city ?? selected.nurse.currentCity}</dd>
                </div>
                <div>
                  <dt>开始日期</dt>
                  <dd>{selected.slot.start}</dd>
                </div>
                <div>
                  <dt>结束日期</dt>
                  <dd>{selected.slot.end}</dd>
                </div>
                <div>
                  <dt>排期来源</dt>
                  <dd>
                    {selected.slot.sourceType === 'order'
                      ? '订单占用'
                      : '手工锁档'}
                  </dd>
                </div>
                <div>
                  <dt>档期状态</dt>
                  <dd>
                    <span className={scheduleStyles[selected.slot.status]}>
                      {selected.slot.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>备注</dt>
                  <dd>{selected.slot.note ?? '无'}</dd>
                </div>
              </dl>
              {selectedConflict && (
                <div className="conflict-detail">
                  <AlertTriangle />
                  <div>
                    <strong>
                      档期 A：{formatShort(selectedConflict.a.start)}–
                      {formatShort(selectedConflict.a.end)}
                    </strong>
                    <strong>
                      档期 B：{formatShort(selectedConflict.b.start)}–
                      {formatShort(selectedConflict.b.end)}
                    </strong>
                    <p>
                      实际重叠：{formatShort(selectedConflict.start)}–
                      {formatShort(selectedConflict.end)}
                    </p>
                  </div>
                </div>
              )}
              <div className="drawer-actions">
                <Button
                  variant="outline"
                  onClick={() => onOpenNurse(selected.nurse.id)}
                >
                  查看月嫂
                </Button>
                {selected.slot.customerId && (
                  <Button
                    className="primary-button"
                    onClick={() => onOpenCustomer(selected.slot.customerId!)}
                  >
                    查看客户
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
