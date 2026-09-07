'use client';

import { ArrowLeft, CalendarPlus, Edit3, History, MapPin, Phone, Send, Star, type LucideIcon } from 'lucide-react';
import type { MaternityNurse } from '@/lib/nurse-types';
import { scheduleStyles } from '@/lib/nurse-constants';
import { NurseStatusBadge } from './nurse-status-badge';
import { Button } from './ui/button';

const ratingLabels={newbornCare:'新生儿护理',postpartumCare:'产妇照护',cooking:'月子餐',communication:'沟通',boundarySense:'边界感',nightCare:'夜间护理'} as const;

export function NurseDetailView({nurse,onBack,onEdit,onSchedule,onSoon}:{nurse:MaternityNurse;onBack:()=>void;onEdit:()=>void;onSchedule:()=>void;onSoon:(x:string)=>void}){
  const infoItems:{label:string;value:string;Icon:LucideIcon|null}[]=[
    {label:'手机号',value:nurse.phone,Icon:Phone},{label:'籍贯',value:nurse.hometown,Icon:MapPin},{label:'当前城市',value:nurse.currentCity,Icon:MapPin},{label:'从业年限',value:`${nurse.experienceYears}年`,Icon:History},{label:'服务户数',value:`${nurse.serviceCount}户`,Icon:History},{label:'26天价格',value:`¥${nurse.price26Days.toLocaleString()}`,Icon:null},{label:'当前状态',value:nurse.status,Icon:null},{label:'最近可上户',value:nurse.availableFrom,Icon:null},
  ];
  return <div className="page-stack detail-page nurse-detail">
    <button className="back-button" onClick={onBack}><ArrowLeft/>返回月嫂列表</button>
    <div className="detail-hero"><div className="detail-person"><div className="detail-avatar nurse-avatar">{nurse.name[0]}</div><div><div className="detail-title"><h1>{nurse.name}</h1><NurseStatusBadge status={nurse.status}/></div><p>{nurse.age}岁 · {nurse.hometown} · {nurse.experienceYears}年经验 · 服务{nurse.serviceCount}户</p></div></div><div className="detail-actions nurse-actions"><Button variant="outline" onClick={onEdit}><Edit3/>编辑资料</Button><Button variant="outline" onClick={()=>onSoon('新增档期')}><CalendarPlus/>新增档期</Button><Button variant="outline" onClick={()=>onSoon('推荐记录')}><History/>推荐记录</Button><Button className="primary-button" onClick={()=>onSoon('推荐给客户')}><Send/>推荐给客户</Button></div></div>
    <div className="nurse-detail-grid"><div className="detail-main">
      <section className="surface info-card"><div className="section-heading"><h2>基础资料</h2></div><div className="info-grid nurse-info">{infoItems.map(({label,value,Icon})=><div key={label}>{Icon?<Icon/>:<span className="yuan">•</span>}<span><small>{label}</small><strong>{value}</strong></span></div>)}</div></section>
      <section className="surface info-card tag-sections"><div><div className="section-heading"><h2>专业技能</h2></div><div className="tag-list">{nurse.skillTags.map(x=><span key={x}>{x}</span>)}</div></div><div><div className="section-heading"><h2>特殊经验</h2></div>{nurse.specialExperienceTags.length?<div className="tag-list special-tags">{nurse.specialExperienceTags.map(x=><span key={x}>{x}</span>)}</div>:<p className="muted">暂无特殊护理经历标签</p>}</div><div><div className="section-heading"><h2>性格与工作方式</h2></div><div className="tag-list personality-tags">{nurse.personalityTags.map(x=><span key={x}>{x}</span>)}</div></div></section>
      <section className="surface info-card"><div className="section-heading"><h2>历史评价聚合</h2><span className="rating overall"><Star/>{nurse.ratings.overall}</span></div><div className="rating-bars">{Object.entries(ratingLabels).map(([key,label])=>{const value=nurse.ratings[key as keyof typeof ratingLabels];return <div key={key}><div><span>{label}</span><strong>{value}</strong></div><span className="bar"><i style={{width:`${value*10}%`}}/></span></div>})}</div></section>
      <section className="surface info-card"><div className="section-heading"><h2>自我介绍</h2></div><p className="body-copy">{nurse.introduction}</p></section>
      <section className="surface info-card"><div className="section-heading"><h2>服务经历</h2><span className="muted">最近 {nurse.serviceHistory.length} 次</span></div><div className="history-list">{nurse.serviceHistory.map(x=><article key={x.id}><time>{x.month}</time><div><strong>{x.city} · {x.familyType}</strong><p>服务{x.days}天</p><div className="mini-tags">{x.highlights.map(t=><span key={t}>{t}</span>)}</div></div><span className="rating"><Star/>{x.rating}</span></article>)}</div></section>
      <section className="surface info-card"><div className="section-heading"><h2>客户评价</h2><span className="muted">来自历史服务</span></div><div className="review-list">{nurse.reviews.map(x=><blockquote key={x.id}><div><span className="rating"><Star/>{x.rating}</span><time>{x.date}</time></div><p>“{x.content}”</p></blockquote>)}</div></section>
    </div><aside className="surface schedule-card"><div className="section-heading"><div><h2>近期档期</h2><p>未来约 3 个月</p></div><Button variant="ghost" onClick={onSchedule}>查看全部</Button></div><div className="detail-schedule">{nurse.schedule.map(x=><button key={x.id} onClick={onSchedule}><time>{x.start.slice(5).replace('-','/')}—{x.end.slice(5).replace('-','/')}</time><span className={scheduleStyles[x.status]}>{x.status}</span>{x.customerName&&<small>客户：{x.customerName}</small>}</button>)}<div className="next-available"><small>下一可上户</small><strong>{nurse.availableFrom}</strong></div></div></aside></div>
  </div>;
}
