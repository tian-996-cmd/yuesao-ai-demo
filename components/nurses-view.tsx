'use client';
import { Filter, Plus, Search, Star, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { availabilityFor, displayStatus } from '@/lib/availability';
import { formatChineseDate } from '@/lib/date';
import type { MediaAsset } from '@/lib/media-types';
import type { MaternityNurse, NurseStatus } from '@/lib/nurse-types';
import { nurseGrade, parseDay } from '@/lib/v3-engine';
import { NurseAvatar } from './nurse-avatar';
import { NurseStatusBadge } from './nurse-status-badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

type Quick =
  | '全部'
  | '当前空档'
  | '7天内空档'
  | '30天内空档'
  | '上户中'
  | '已锁档';
const clean = (value: string) => value.trim().replace(/\s+/g, '').toLowerCase();

export function NursesView({
  nurses,
  media,
  currentDate,
  initialFilter,
  onOpen,
  onCreate,
}: {
  nurses: MaternityNurse[];
  media: MediaAsset[];
  currentDate: string;
  initialFilter?: NurseStatus;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Quick>(
    initialFilter === '空档' ? '当前空档' : '全部',
  );
  const [more, setMore] = useState(false);
  const [minYears, setMinYears] = useState(0);
  const [maxPrice, setMaxPrice] = useState(30000);
  const [skill, setSkill] = useState('全部技能');
  const skills = useMemo(
    () => [...new Set(nurses.flatMap((item) => item.skillTags))].sort(),
    [nurses],
  );
  const visible = useMemo(
    () =>
      nurses.filter((item) => {
        const value = availabilityFor(item, currentDate);
        const active = item.status !== '不可接单';
        const days =
          (parseDay(value.nextAvailableDate) - parseDay(currentDate)) /
          86400000;
        const quick =
          filter === '全部' ||
          (active && filter === '当前空档' && value.currentAvailable) ||
          (active && filter === '7天内空档' && days >= 0 && days <= 7) ||
          (active && filter === '30天内空档' && days >= 0 && days <= 30) ||
          (active && filter === '上户中' && value.inService) ||
          (active && filter === '已锁档' && value.locked);
        return (
          clean(
            `${item.name}${item.hometown}${item.skillTags.join('')}`,
          ).includes(clean(query)) &&
          quick &&
          item.experienceYears >= minYears &&
          item.price26Days <= maxPrice &&
          (skill === '全部技能' || item.skillTags.includes(skill))
        );
      }),
    [nurses, currentDate, query, filter, minYears, maxPrice, skill],
  );

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">人才资源池</div>
          <h1>月嫂</h1>
          <p>管理月嫂档案、能力、价格和可用档期。</p>
        </div>
        <Button className="primary-button" onClick={onCreate}>
          <Plus />
          新增月嫂
        </Button>
      </div>
      <section className="pool-surface">
        <div className="pool-toolbar">
          <div className="search-box">
            <Search />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="姓名、籍贯或技能"
            />
          </div>
          <div className="filter-tabs">
            {(
              [
                '全部',
                '当前空档',
                '7天内空档',
                '30天内空档',
                '上户中',
                '已锁档',
              ] as Quick[]
            ).map((item) => (
              <button
                key={item}
                className={filter === item ? 'active' : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={() => setMore(true)}>
            <Filter />
            高级筛选
          </Button>
          <span>{visible.length} 位</span>
        </div>
        {visible.length ? (
          <>
            <div className="desktop-table pool-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>人物</TableHead>
                    <TableHead>服务单数</TableHead>
                    <TableHead>参考价</TableHead>
                    <TableHead>核心能力</TableHead>
                    <TableHead>当前状态</TableHead>
                    <TableHead>下一长期空档</TableHead>
                    <TableHead>综合评价</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((item) => {
                    const availability = availabilityFor(item, currentDate);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <button
                            className="nurse-person"
                            onClick={() => onOpen(item.id)}
                          >
                            <NurseAvatar
                              nurseId={item.id}
                              name={item.name}
                              media={media}
                            />
                            <span>
                              <b>{item.name}</b>
                              <small>
                                {nurseGrade(item)}月嫂 · {item.age}岁
                              </small>
                              <small>
                                {item.hometown} · {item.experienceYears}年经验
                              </small>
                            </span>
                          </button>
                        </TableCell>
                        <TableCell>{item.serviceCount}单</TableCell>
                        <TableCell>
                          <strong className="table-price">
                            ¥{item.price26Days.toLocaleString()}
                          </strong>
                          <small>/26天</small>
                        </TableCell>
                        <TableCell>
                          <div className="mini-tags">
                            {item.skillTags.slice(0, 2).map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <NurseStatusBadge
                            status={displayStatus(item, currentDate)}
                          />
                        </TableCell>
                        <TableCell>
                          {formatChineseDate(availability.nextAvailableDate)}起
                        </TableCell>
                        <TableCell>
                          <span className="rating">
                            <Star />
                            {item.ratings.overall}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            className="next-action"
                            onClick={() => onOpen(item.id)}
                          >
                            查看资料
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mobile-nurse-list">
              {visible.map((item) => (
                <button
                  className="nurse-card"
                  key={item.id}
                  onClick={() => onOpen(item.id)}
                >
                  <header>
                    <NurseAvatar
                      nurseId={item.id}
                      name={item.name}
                      media={media}
                    />
                    <span>
                      <strong>
                        {item.name} · {nurseGrade(item)}
                      </strong>
                      <small>
                        {item.age}岁 · {item.hometown} · {item.experienceYears}
                        年
                      </small>
                    </span>
                    <NurseStatusBadge
                      status={displayStatus(item, currentDate)}
                    />
                  </header>
                  <div className="nurse-price">
                    <strong>¥{item.price26Days.toLocaleString()}</strong>
                    <span>/26天</span>
                    <span>
                      空档{' '}
                      {formatChineseDate(
                        availabilityFor(item, currentDate).nextAvailableDate,
                      )}
                    </span>
                  </div>
                  <div className="mini-tags">
                    {item.skillTags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <UsersRound />
            <h3>没有找到“{query}”相关月嫂</h3>
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setFilter('全部');
                setSkill('全部技能');
              }}
            >
              清除筛选
            </Button>
          </div>
        )}
      </section>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent className="filter-sheet">
          <SheetHeader>
            <SheetTitle>高级筛选</SheetTitle>
          </SheetHeader>
          <div className="filter-form">
            <label>
              技能
              <select
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
              >
                <option>全部技能</option>
                {skills.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              最低从业年限
              <Input
                type="number"
                min="0"
                value={minYears}
                onChange={(event) =>
                  setMinYears(Math.max(0, Number(event.target.value)))
                }
              />
            </label>
            <label>
              最高参考价
              <Input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(Math.max(0, Number(event.target.value)))
                }
              />
            </label>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSkill('全部技能');
                setMinYears(0);
                setMaxPrice(30000);
              }}
            >
              清除
            </Button>
            <Button className="primary-button" onClick={() => setMore(false)}>
              查看 {visible.length} 位
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
