'use client';

import { ArrowLeft, MessageSquarePlus, ScanText, Sparkles } from 'lucide-react';
import type { MediaAsset } from '@/lib/media-types';
import type { MaternityNurse } from '@/lib/nurse-types';
import type { Customer } from '@/lib/types';
import { NurseAvatar } from './nurse-avatar';
import { StatusBadge } from './status-badge';
import { Button } from './ui/button';

export function CustomerDetailView({ customer, nurses, media, onBack, onFollow, onParse, onMatch, onOpenNurse }: {
  customer: Customer; nurses: MaternityNurse[]; media: MediaAsset[]; onBack: () => void; onFollow: () => void; onParse: () => void; onMatch: () => void; onOpenNurse: (id: string) => void;
}) {
  const recs = (customer.recommendedNurseIds ?? []).map((id) => nurses.find((nurse) => nurse.id === id)).filter(Boolean) as MaternityNurse[];
  return <div className="page-stack customer-record">
    <button className="back-button" onClick={onBack}><ArrowLeft />返回客户列表</button>
    <header className="record-header customer-record-hero">
      <div className="detail-avatar">{customer.name[0]}</div>
      <div><div><h1>{customer.name}</h1><StatusBadge status={customer.status} /></div><p>{customer.phone} · {customer.city} · 预产期 {customer.dueDate}</p><small>负责人：{customer.consultant}　最近跟进：{customer.lastFollowUp}</small></div>
      <div className="record-actions"><Button variant="outline" onClick={onFollow}><MessageSquarePlus />新增跟进</Button><Button className="primary-button" onClick={onMatch}><Sparkles />智能匹配</Button></div>
    </header>
    <div className="record-layout"><main>
      <section className="record-section"><header><h2>服务需求</h2><Button variant="ghost" onClick={onParse}><ScanText />AI 整理客户需求</Button></header><dl className="definition-grid">{[
        ['手机号', customer.phone], ['城市', customer.city], ['预产期', customer.dueDate], ['服务天数', `${customer.serviceDays}天`], ['预算', `¥${customer.budgetMin.toLocaleString()}–${customer.budgetMax.toLocaleString()}`], ['胎次', customer.parity],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="record-tags"><div><span>核心条件</span>{customer.requirements.map((item) => <i key={item}>{item}</i>)}</div><div className="negative"><span>明确排斥</span>{customer.exclusions.length ? customer.exclusions.map((item) => <i key={item}>{item}</i>) : <em>暂无</em>}</div></div></section>
      <section className="record-section"><header><h2>AI 需求解析</h2><Button variant="ghost" onClick={onParse}>{customer.demandProfile ? '重新解析' : '开始解析'}</Button></header>{customer.demandProfile ? <div className="parsed-summary"><p><b>预算弹性</b>{customer.demandProfile.budgetFlexibility}</p><p><b>家庭情况</b>{customer.demandProfile.familySituation}</p><p><b>软偏好</b>{customer.demandProfile.preferences.join('、')}</p><p><b>待确认</b>{customer.demandProfile.questions.join('；')}</p></div> : <div className="inline-empty">尚未结构化解析，点击后可从原始沟通记录提取需求。</div>}</section>
      <section className="record-section"><header><h2>推荐结果</h2><Button variant="ghost" onClick={onMatch}>进入匹配中心</Button></header>{recs.length ? <div className="recommended-strip">{recs.map((nurse) => <button key={nurse.id} onClick={() => onOpenNurse(nurse.id)}><NurseAvatar nurseId={nurse.id} name={nurse.name} media={media} /><span><strong>{nurse.name}</strong><small>{nurse.experienceYears}年 · ¥{nurse.price26Days.toLocaleString()}</small></span></button>)}</div> : <div className="inline-empty">暂无推荐结果</div>}</section>
      <section className="record-section"><h2>家庭情况</h2><p>{customer.family}</p></section><section className="record-section original-record"><h2>原始客户描述</h2><blockquote>{customer.originalNote}</blockquote></section>
    </main><aside className="business-sidebar"><section><h2>下一步动作</h2><ol><li className="current">确认客户需求</li><li>筛选并推荐候选人</li><li>安排视频面试</li><li>锁定服务档期</li></ol></section><section><h2>跟进时间线</h2><div className="timeline">{customer.followUps.map((item, index) => <div className="timeline-item" key={`${item.time}-${index}`}><span className={index === 0 ? 'current' : ''} /><div><time>{item.time}</time><p>{item.content}</p><small>{customer.consultant}</small></div></div>)}</div></section></aside></div>
  </div>;
}
