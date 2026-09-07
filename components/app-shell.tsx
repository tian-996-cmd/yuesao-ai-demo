'use client';

import { CalendarDays, HeartHandshake, Home, Settings, Sparkles, UserRound, UsersRound, ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';

export type ViewName = 'dashboard' | 'customers' | 'detail';

const desktopItems = [
  { label:'工作台', icon:Home, view:'dashboard' as const },
  { label:'客户', icon:UsersRound, view:'customers' as const },
  { label:'月嫂', icon:UserRound },
  { label:'档期', icon:CalendarDays },
  { label:'AI 匹配', icon:Sparkles },
  { label:'跟进', icon:ClipboardList },
];

export function AppShell({ children, view, onNavigate, onSoon }: { children: ReactNode; view: ViewName; onNavigate:(view:ViewName)=>void; onSoon:(name:string)=>void }) {
  const active = view === 'detail' ? 'customers' : view;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark"><HeartHandshake /></div><div><strong>月嫂 AI</strong><span>业务助手</span></div></div>
        <nav aria-label="主导航">
          {desktopItems.map((item) => <button key={item.label} className={active === item.view ? 'active' : ''} onClick={() => item.view ? onNavigate(item.view) : onSoon(item.label)}><item.icon />{item.label}{item.label === 'AI 匹配' && <span className="nav-badge">AI</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => onSoon('设置')}><Settings />设置</button>
          <div className="consultant"><div className="avatar">王</div><div><strong>王敏</strong><span>销售顾问</span></div><span className="online-dot" /></div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><HeartHandshake /></div><strong>月嫂 AI</strong></div><div className="topbar-date"><CalendarDays /> 2026年9月7日 · 星期一</div><div className="topbar-user"><div><strong>王敏</strong><span>销售顾问</span></div><div className="avatar">王</div></div></header>
        <main className="content">{children}</main>
      </div>
      <nav className="bottom-nav" aria-label="手机导航">
        {[{label:'首页',icon:Home,view:'dashboard' as const},{label:'客户',icon:UsersRound,view:'customers' as const},{label:'匹配',icon:Sparkles},{label:'月嫂',icon:UserRound},{label:'我的',icon:Settings}].map((item) => <button key={item.label} className={active === item.view ? 'active' : ''} onClick={() => item.view ? onNavigate(item.view) : onSoon(item.label)}><item.icon /><span>{item.label}</span></button>)}
      </nav>
    </div>
  );
}
