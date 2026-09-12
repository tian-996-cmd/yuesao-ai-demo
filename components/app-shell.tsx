'use client';

import {
  ArrowRight,
  CalendarDays,
  HeartHandshake,
  Home,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  ClipboardList,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

export type ViewName =
  | 'dashboard'
  | 'customers'
  | 'detail'
  | 'nurses'
  | 'nurseDetail'
  | 'orders'
  | 'schedule'
  | 'matching'
  | 'settings';

const desktopItems = [
  { label: '工作台', icon: Home, view: 'dashboard' as const },
  { label: '客户', icon: UsersRound, view: 'customers' as const },
  { label: '月嫂', icon: UserRound, view: 'nurses' as const },
  { label: '服务订单', icon: ClipboardList, view: 'orders' as const },
  { label: '档期', icon: CalendarDays, view: 'schedule' as const },
  { label: 'AI 匹配', icon: Sparkles, view: 'matching' as const },
  { label: '跟进', icon: ClipboardList, view: 'customers' as const },
];

export function AppShell({
  children,
  view,
  onNavigate,
  onSoon,
  currentDate,
}: {
  children: ReactNode;
  view: ViewName;
  onNavigate: (view: ViewName) => void;
  onSoon: (name: string) => void;
  currentDate: string;
}) {
  const [assistant, setAssistant] = useState(false);
  const active =
    view === 'detail' ? 'customers' : view === 'nurseDetail' ? 'nurses' : view;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <HeartHandshake />
          </div>
          <div>
            <strong>月嫂 AI</strong>
            <span>业务助手</span>
          </div>
        </div>
        <nav aria-label="主导航">
          {desktopItems.map((item) => (
            <button
              key={item.label}
              className={
                active === item.view && item.label !== '跟进' ? 'active' : ''
              }
              onClick={() => onNavigate(item.view)}
            >
              <item.icon />
              {item.label}
              {item.label === 'AI 匹配' && (
                <span className="nav-badge">AI</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={active === 'settings' ? 'active' : ''}
            onClick={() => onNavigate('settings')}
          >
            <Settings />
            设置
          </button>
          <div className="consultant">
            <div className="avatar">王</div>
            <div>
              <strong>王敏</strong>
              <span>销售顾问</span>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark">
              <HeartHandshake />
            </div>
            <strong>月嫂 AI</strong>
          </div>
          <div className="topbar-date">
            <CalendarDays />{' '}
            {new Intl.DateTimeFormat('zh-CN', {
              timeZone: 'Asia/Shanghai',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            }).format(new Date(`${currentDate}T00:00:00+08:00`))}
          </div>
          <button
            className="ai-helper-button"
            onClick={() => setAssistant(true)}
          >
            <Sparkles />
            AI 助手
          </button>
          <div className="topbar-user">
            <div>
              <strong>王敏</strong>
              <span>销售顾问</span>
            </div>
            <div className="avatar">王</div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      <nav className="bottom-nav" aria-label="手机导航">
        {[
          { label: '首页', icon: Home, view: 'dashboard' as const },
          { label: '客户', icon: UsersRound, view: 'customers' as const },
          { label: '订单', icon: ClipboardList, view: 'orders' as const },
          { label: '档期', icon: CalendarDays, view: 'schedule' as const },
          { label: '月嫂', icon: UserRound, view: 'nurses' as const },
          { label: '我的', icon: Settings, view: 'settings' as const },
        ].map((item) => (
          <button
            key={item.label}
            className={active === item.view ? 'active' : ''}
            onClick={() => onNavigate(item.view)}
          >
            <item.icon />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <Sheet open={assistant} onOpenChange={setAssistant}>
        <SheetContent className="assistant-sheet">
          <SheetHeader>
            <div className="eyebrow">全局辅助入口</div>
            <SheetTitle>AI 业务助手</SheetTitle>
            <SheetDescription>
              直接返回业务对象和下一步，不做聊天式长回答。
            </SheetDescription>
          </SheetHeader>
          <div className="quick-prompts">
            {[
              '帮我找10月份有完整26天空档的月嫂',
              '哪些客户还没有匹配月嫂',
              '未来30天有哪些月嫂即将下户',
              '有哪些月嫂存在档期冲突',
              '给王女士推荐3位月嫂',
            ].map((x, i) => (
              <button
                key={x}
                onClick={() => {
                  setAssistant(false);
                  onNavigate(
                    i === 1
                      ? 'customers'
                      : i === 2 || i === 3
                        ? 'schedule'
                        : i === 4
                          ? 'matching'
                          : 'nurses',
                  );
                }}
              >
                <span>{x}</span>
                <ArrowRight />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
