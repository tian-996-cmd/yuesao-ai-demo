'use client';

import { ArrowRight, Baby, CalendarClock, Clock3, Plus, ScanText, Sparkles, UserCheck } from 'lucide-react';
import { dashboardTasks } from '@/lib/mock-data';
import type { Customer } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function DashboardView({ customers, freeNurseCount, onOpenCustomer, onAllCustomers, onCreateCustomer, onFreeNurses, onSchedule, onSoon }: { customers:Customer[]; freeNurseCount:number; onOpenCustomer:(id:string)=>void; onAllCustomers:()=>void; onCreateCustomer:()=>void; onFreeNurses:()=>void; onSchedule:()=>void; onSoon:(name:string)=>void }) {
  const stats = [
    { label:'今日待跟进', value:'6', note:'2 项即将超时', icon:Clock3, tone:'coral' },
    { label:'待匹配客户', value:'3', note:'较昨日 +1', icon:Sparkles, tone:'violet' },
    { label:'近期预产客户', value:'8', note:'未来 60 天', icon:Baby, tone:'blue' },
    { label:'当前空档月嫂', value:String(freeNurseCount), note:'可立即推荐', icon:UserCheck, tone:'green', onClick:onFreeNurses },
  ];
  return (
    <div className="page-stack dashboard-page">
      <div className="page-heading dashboard-heading"><div><div className="eyebrow">工作台</div><h1>早上好，王顾问</h1><p>今天有一些客户需要你的关注。</p></div><div className="heading-actions"><Button variant="outline" onClick={()=>onSoon('AI 智能录入')}><ScanText/>AI 智能录入</Button><Button className="primary-button" onClick={onCreateCustomer}><Plus/>新建客户</Button><span className="date-chip"><CalendarClock /> 9月7日</span></div></div>
      <section className="stats-grid" aria-label="今日概览">
        {stats.map((stat) => <button type="button" className={`stat-card ${stat.onClick?'clickable-stat':''}`} key={stat.label} onClick={stat.onClick}><div className={`stat-icon ${stat.tone}`}><stat.icon /></div><div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div></button>)}
      </section>
      <div className="dashboard-grid">
        <section className="surface todo-section">
          <div className="section-heading"><div><h2>今日待办</h2><p>优先处理需要推进的客户</p></div><span className="count-pill">4 项</span></div>
          <div className="task-list">
            {dashboardTasks.map((task, index) => <button className="task-item" key={task.name} onClick={() => onOpenCustomer(task.customerId)}><span className={`task-dot task-${index}`} /><span className="task-copy"><strong>{task.name}</strong><small>{task.detail}</small></span><span className="task-status">{task.status}</span><ArrowRight /></button>)}
          </div>
        </section>
        <section className="surface ai-reminders">
          <div className="section-heading"><div><h2><Sparkles /> AI 提醒</h2><p>基于当前业务数据模拟</p></div></div>
          <div className="reminder-list">
            <button onClick={() => onOpenCustomer('wang')}><span className="reminder-icon">24h</span><span><strong>王女士尚未回复</strong><small>推荐结果已发送 24 小时</small></span><em>去跟进</em></button>
            <button onClick={() => onSoon('重新匹配')}><span className="reminder-icon">¥</span><span><strong>预算发生变化</strong><small>建议为李女士重新匹配</small></span><em>重新匹配</em></button>
            <button onClick={onSchedule}><span className="reminder-icon">!</span><span><strong>档期可能重叠</strong><small>张姐 11 月档期需确认</small></span><em>查看档期</em></button>
          </div>
        </section>
      </div>
      <section className="surface recent-section">
        <div className="section-heading"><div><h2>最近客户</h2><p>近期有更新的客户进展</p></div><Button variant="ghost" onClick={onAllCustomers}>查看全部 <ArrowRight /></Button></div>
        <div className="desktop-table"><Table><TableHeader><TableRow><TableHead>客户</TableHead><TableHead>预产期</TableHead><TableHead>预算</TableHead><TableHead>当前状态</TableHead><TableHead>负责顾问</TableHead><TableHead>最近跟进</TableHead></TableRow></TableHeader><TableBody>{customers.slice(0,5).map(customer => <TableRow key={customer.id} onClick={() => onOpenCustomer(customer.id)} className="clickable-row"><TableCell><strong>{customer.name}</strong><small>{customer.city}</small></TableCell><TableCell>{customer.dueDate}</TableCell><TableCell>¥{customer.budgetMin.toLocaleString()}–{customer.budgetMax.toLocaleString()}</TableCell><TableCell><StatusBadge status={customer.status} /></TableCell><TableCell>{customer.consultant}</TableCell><TableCell>{customer.lastFollowUp}</TableCell></TableRow>)}</TableBody></Table></div>
        <div className="mobile-customer-list compact">{customers.slice(0,4).map(customer => <button className="customer-card" key={customer.id} onClick={() => onOpenCustomer(customer.id)}><div><strong>{customer.name}</strong><StatusBadge status={customer.status} /></div><p>{customer.dueDate} · ¥{(customer.budgetMin/1000).toFixed(1)}k–{(customer.budgetMax/1000).toFixed(1)}k</p><small>{customer.lastFollowUp} 跟进</small></button>)}</div>
      </section>
    </div>
  );
}
