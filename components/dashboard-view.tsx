import { AlertTriangle,ArrowRight,CalendarCheck,CalendarMinus,Clock3,Plus,ScanText,Sparkles } from 'lucide-react';
import type { Customer } from '@/lib/types';
import type { MaternityNurse } from '@/lib/nurse-types';
import type { MediaAsset } from '@/lib/media-types';
import { dashboardMetrics,detectScheduleConflicts,formatShort,parseDay,DEMO_TODAY } from '@/lib/v3-engine';
import { Button } from './ui/button';
import { NurseAvatar } from './nurse-avatar';

export function DashboardView({customers,nurses,media,onOpenCustomer,onCreateCustomer,onMatching,onSchedule,onParse}:{customers:Customer[];nurses:MaternityNurse[];media:MediaAsset[];onOpenCustomer:(id:string)=>void;onCreateCustomer:()=>void;onMatching:(id?:string)=>void;onSchedule:()=>void;onParse:(id:string)=>void}){
  const m=dashboardMetrics(customers,nurses);
  const conflicts=detectScheduleConflicts(nurses);
  const today=DEMO_TODAY.getTime();
  const flow=nurses.flatMap(n=>n.schedule.map(slot=>({nurse:n,slot}))).filter(x=>{const d=parseDay(x.slot.start);const e=parseDay(x.slot.end);return(d>=today&&d<=today+15*86400000)||(e>=today&&e<=today+15*86400000)}).slice(0,6);
  const stats=[
    ['今日待跟进',m.followups,'需推进的客户',Clock3,()=>onOpenCustomer(customers.find(c=>c.status!=='已完成')?.id??'wang')],
    ['待匹配客户',m.matching,'等待资源筛选',Sparkles,()=>onMatching()],
    ['即将上户',m.starting,'未来90天',CalendarCheck,onSchedule],
    ['即将下户',m.ending,'未来90天',CalendarMinus,onSchedule],
    ['档期冲突',m.conflicts,'需立即核对',AlertTriangle,onSchedule]
  ] as const;
  return <div className="page-stack owner-dashboard">
    <header className="welcome-hero"><div><div className="eyebrow">老板工作台 · 今日概览</div><h1>上午好，王敏</h1><p>今天有 <strong>{m.followups} 位客户</strong>需要跟进，<strong>{m.conflicts} 位月嫂</strong>存在档期冲突。</p></div><div className="heading-actions"><Button variant="outline" onClick={()=>onParse('wang')}><ScanText/>AI 整理需求</Button><Button className="primary-button" onClick={onCreateCustomer}><Plus/>新建客户</Button></div></header>
    <section className="v3-stats">{stats.map(([a,b,c,Icon,action])=><button key={a} onClick={action}><Icon/><span>{a}</span><strong>{b}</strong><small>{c}</small></button>)}</section>
    <div className="ops-grid">
      <section className="ops-list"><header><h2>今日待办</h2><span>{Math.min(customers.length,4)} 项</span></header>{customers.slice(0,4).map(c=><article key={c.id}><div><strong>{c.name}</strong><p>{c.status==='待匹配'?'预算发生变化，建议重新匹配':c.status==='已推荐'?`已推荐${c.recommendedCount}位，等待客户反馈`:c.status==='沟通中'?'需要确认面试结果':'需要补充客户需求'}</p></div><Button variant="ghost" onClick={()=>c.status==='待匹配'?onMatching(c.id):onOpenCustomer(c.id)}>{c.status==='待匹配'?'重新匹配':'查看客户'}<ArrowRight/></Button></article>)}</section>
      <aside className="risk-list"><header><h2>业务风险 / AI 提醒</h2></header>{conflicts.slice(0,1).map(x=><button key={x.a.id} onClick={onSchedule}><AlertTriangle/><span><strong>{x.nurse.name} 存在档期冲突</strong><small>{formatShort(x.start)}–{formatShort(x.end)}</small></span><ArrowRight/></button>)}<button onClick={onSchedule}><CalendarMinus/><span><strong>{m.ending} 位月嫂即将下户</strong><small>建议提前安排下一单</small></span><ArrowRight/></button><button onClick={()=>onOpenCustomer('wang')}><Clock3/><span><strong>客户跟进需要推进</strong><small>查看最新沟通记录</small></span><ArrowRight/></button></aside>
    </div>
    <section className="flow-board"><header><div><h2>未来人员流转</h2><p>未来 15 天上户与下户安排</p></div><Button variant="ghost" onClick={onSchedule}>查看档期中心<ArrowRight/></Button></header><div>{flow.length?flow.map(x=><button key={x.slot.id} onClick={onSchedule}><NurseAvatar nurseId={x.nurse.id} name={x.nurse.name} media={media}/><span><strong>{x.nurse.name}</strong><small>{x.slot.status} · {formatShort(x.slot.start)}–{formatShort(x.slot.end)}</small></span></button>):<p className="empty-inline">未来15天暂无人员流转</p>}</div></section>
  </div>;
}
