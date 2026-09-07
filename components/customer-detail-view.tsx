'use client';

import { ArrowLeft, CalendarDays, Edit3, MapPin, MessageSquarePlus, Phone, Sparkles, UserRound } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { Button } from './ui/button';

export function CustomerDetailView({ customer, onBack, onSoon }: { customer:Customer; onBack:()=>void; onSoon:(name:string)=>void }) {
  const basic = [['手机号',customer.phone,Phone],['城市',customer.city,MapPin],['预产期',customer.dueDate,CalendarDays],['服务天数',`${customer.serviceDays} 天`,CalendarDays],['预算',`¥${customer.budgetMin.toLocaleString()}–${customer.budgetMax.toLocaleString()}`,null],['胎次',customer.parity,UserRound]] as const;
  return <div className="page-stack detail-page">
    <button className="back-button" onClick={onBack}><ArrowLeft />返回客户列表</button>
    <div className="detail-hero"><div className="detail-person"><div className="detail-avatar">{customer.name[0]}</div><div><div className="detail-title"><h1>{customer.name}</h1><StatusBadge status={customer.status}/></div><p>负责顾问：{customer.consultant} · 最近跟进 {customer.lastFollowUp}</p></div></div><div className="detail-actions"><Button variant="outline" onClick={()=>onSoon('编辑资料')}><Edit3 />编辑资料</Button><Button variant="outline" onClick={()=>onSoon('新增跟进')}><MessageSquarePlus />新增跟进</Button><Button className="primary-button" onClick={()=>onSoon('AI 匹配')}><Sparkles />智能匹配月嫂</Button></div></div>
    <div className="detail-grid"><div className="detail-main">
      <section className="surface info-card"><div className="section-heading"><h2>基础信息</h2></div><div className="info-grid">{basic.map(([label,value,Icon])=><div key={label}>{Icon ? <Icon/> : <span className="yuan">¥</span>}<span><small>{label}</small><strong>{value}</strong></span></div>)}</div></section>
      <section className="surface info-card"><div className="section-heading"><h2>家庭情况</h2></div><p className="body-copy">{customer.family}</p></section>
      <section className="surface info-card requirements-card"><div><div className="section-heading"><h2>核心需求</h2></div><div className="tag-list">{customer.requirements.map(x=><span key={x}>{x}</span>)}</div></div><div><div className="section-heading"><h2>明确排斥</h2></div>{customer.exclusions.length ? <div className="tag-list exclusions">{customer.exclusions.map(x=><span key={x}>{x}</span>)}</div>:<p className="muted">暂无明确排斥项</p>}</div></section>
      <section className="surface original-note"><div className="quote-mark">“</div><div><div className="section-heading"><h2>客户原始描述</h2><span>需求解析入口</span></div><p>{customer.originalNote}</p></div></section>
    </div><aside className="surface timeline-card"><div className="section-heading"><div><h2>跟进记录</h2><p>共 {customer.followUps.length} 条</p></div></div><div className="timeline">{customer.followUps.map((item,i)=><div className="timeline-item" key={item.time}><span className={i===0?'current':''}/><div><time>{item.time}</time><p>{item.content}</p><small>{customer.consultant}</small></div></div>)}</div></aside></div>
  </div>;
}
