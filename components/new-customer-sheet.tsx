'use client';

import { useState } from 'react';
import { ScanText } from 'lucide-react';
import type { NewCustomerInput } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './ui/sheet';

const initial: NewCustomerInput = { name:'', phone:'', city:'西安', dueDate:'', budgetMin:12000, budgetMax:16000, serviceDays:26, parity:'第一胎', originalNote:'' };

export function NewCustomerSheet({ open, onOpenChange, onSave }: { open:boolean; onOpenChange:(open:boolean)=>void; onSave:(input:NewCustomerInput)=>void }) {
  const [form,setForm] = useState(initial);
  const set = <K extends keyof NewCustomerInput>(key:K,value:NewCustomerInput[K]) => setForm(prev=>({...prev,[key]:value}));
  const submit = (event:React.FormEvent) => { event.preventDefault(); if(!form.name || !form.phone || !form.dueDate) return; onSave(form); setForm(initial); onOpenChange(false); };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="new-customer-sheet"><form onSubmit={submit}><SheetHeader><div className="eyebrow">建立客户档案</div><SheetTitle>新建客户</SheetTitle><SheetDescription>先记录基础信息，详细需求可稍后补充。</SheetDescription></SheetHeader><div className="form-grid">
    <label>客户姓名 <Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="例如：林女士" required /></label>
    <label>联系方式 <Input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="手机号" required /></label>
    <label>城市 <Input value={form.city} onChange={e=>set('city',e.target.value)} required /></label>
    <label>预产期 <Input type="date" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)} required /></label>
    <label>预算下限 <Input type="number" value={form.budgetMin} onChange={e=>set('budgetMin',Number(e.target.value))} /></label>
    <label>预算上限 <Input type="number" value={form.budgetMax} onChange={e=>set('budgetMax',Number(e.target.value))} /></label>
    <label>服务天数 <Input type="number" value={form.serviceDays} onChange={e=>set('serviceDays',Number(e.target.value))} /></label>
    <label>胎次 <select value={form.parity} onChange={e=>set('parity',e.target.value as NewCustomerInput['parity'])}><option>第一胎</option><option>二胎</option><option>三胎</option><option>双胞胎</option></select></label>
    <label className="full">客户需求备注 <Textarea value={form.originalNote} onChange={e=>set('originalNote',e.target.value)} placeholder="用客户的原话记录最重要的需求……" rows={5} /><Button type="button" variant="outline" onClick={()=>{if(form.originalNote){if(form.originalNote.includes('11月底'))set('dueDate','2026-11-28');if(form.originalNote.includes('一万五六')){set('budgetMin',15000);set('budgetMax',16000)}}}}><ScanText/>AI 整理客户需求</Button></label>
  </div><SheetFooter><Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>取消</Button><Button type="submit" className="primary-button" disabled={!form.name || !form.phone || !form.dueDate}>保存客户</Button></SheetFooter></form></SheetContent></Sheet>;
}
