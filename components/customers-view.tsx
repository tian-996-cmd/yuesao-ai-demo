'use client';

import { ArrowRight, Plus, Search, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Customer, CustomerStatus } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const filters: ('全部' | CustomerStatus)[] = ['全部','待匹配','已推荐','待面试','已签约'];

export function CustomersView({ customers, onOpen, onCreate }: { customers:Customer[]; onOpen:(id:string)=>void; onCreate:()=>void }) {
  const [query,setQuery] = useState(''); const [filter,setFilter] = useState<'全部'|CustomerStatus>('全部');
  const visible = useMemo(() => customers.filter(c => c.name.includes(query.trim()) && (filter === '全部' || c.status === filter)),[customers,query,filter]);
  return <div className="page-stack">
    <div className="page-heading customer-heading"><div><div className="eyebrow">客户管理</div><h1>客户</h1><p>管理客户需求、匹配进度和跟进状态。</p></div><Button className="primary-button" onClick={onCreate}><Plus />新建客户</Button></div>
    <section className="surface customer-surface">
      <div className="customer-toolbar"><div className="search-box"><Search /><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索客户姓名" aria-label="搜索客户姓名" /></div><div className="filter-tabs">{filters.map(item=><button className={filter===item?'active':''} key={item} onClick={()=>setFilter(item)}>{item}</button>)}</div></div>
      {visible.length ? <><div className="desktop-table"><Table><TableHeader><TableRow><TableHead>客户姓名</TableHead><TableHead>预产期</TableHead><TableHead>预算</TableHead><TableHead>当前状态</TableHead><TableHead>已推荐</TableHead><TableHead>负责顾问</TableHead><TableHead>最近跟进</TableHead><TableHead /></TableRow></TableHeader><TableBody>{visible.map(c=><TableRow key={c.id} className="clickable-row" onClick={()=>onOpen(c.id)}><TableCell><strong>{c.name}</strong><small>{c.city} · {c.parity}</small></TableCell><TableCell>{c.dueDate}</TableCell><TableCell>¥{c.budgetMin.toLocaleString()}–{c.budgetMax.toLocaleString()}</TableCell><TableCell><StatusBadge status={c.status}/></TableCell><TableCell>{c.recommendedCount ? `${c.recommendedCount} 位` : '—'}</TableCell><TableCell>{c.consultant}</TableCell><TableCell>{c.lastFollowUp}</TableCell><TableCell><ArrowRight /></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="mobile-customer-list">{visible.map(c=><button className="customer-card" key={c.id} onClick={()=>onOpen(c.id)}><div><strong>{c.name}<small>{c.city}</small></strong><StatusBadge status={c.status}/></div><dl><div><dt>预产期</dt><dd>{c.dueDate}</dd></div><div><dt>预算</dt><dd>¥{c.budgetMin.toLocaleString()}–{c.budgetMax.toLocaleString()}</dd></div></dl><footer><span>{c.lastFollowUp} 跟进</span><ArrowRight /></footer></button>)}</div></> : <div className="empty-state"><UsersRound /><h3>没有找到客户</h3><p>试试更换搜索词或筛选条件。</p></div>}
    </section>
  </div>;
}
