'use client';

import { useEffect, useState } from 'react';
import { AppShell, type ViewName } from '@/components/app-shell';
import { CustomerDetailView } from '@/components/customer-detail-view';
import { CustomersView } from '@/components/customers-view';
import { DashboardView } from '@/components/dashboard-view';
import { LoginView } from '@/components/login-view';
import { NewCustomerSheet } from '@/components/new-customer-sheet';
import { mockCustomers } from '@/lib/mock-data';
import type { Customer, NewCustomerInput } from '@/lib/types';

const STORAGE_KEY = 'yuesao-demo-customers-v1';

export default function Home() {
  const [loggedIn,setLoggedIn] = useState(false); const [view,setView] = useState<ViewName>('dashboard'); const [customers,setCustomers] = useState<Customer[]>(mockCustomers); const [selectedId,setSelectedId] = useState('wang'); const [sheetOpen,setSheetOpen] = useState(false); const [message,setMessage] = useState('');
  useEffect(()=>{ const saved=localStorage.getItem(STORAGE_KEY); if(saved) try{setCustomers(JSON.parse(saved));}catch{} },[]);
  const persist=(next:Customer[])=>{setCustomers(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next));};
  const openCustomer=(id:string)=>{setSelectedId(id);setView('detail');window.scrollTo(0,0);};
  const notify=(name:string)=>{setMessage(name==='AI 匹配'?'AI 匹配将在下一阶段加入。':`${name}功能将在后续 Demo 中加入。`);window.setTimeout(()=>setMessage(''),2600);};
  const save=(input:NewCustomerInput)=>{const item:Customer={...input,id:`local-${Date.now()}`,phone:input.phone.replace(/(\d{3})\d+(\d{4})/,'$1****$2'),family:'待补充家庭情况。',requirements:[],exclusions:[],status:'新客户',recommendedCount:0,consultant:'王敏',lastFollowUp:'刚刚',followUps:[{time:'刚刚',content:'新建客户档案。'}]};persist([item,...customers]);setMessage('客户已保存到本地列表');};
  const reset=()=>{persist(mockCustomers);setMessage('演示数据已恢复');};
  useEffect(()=>{
    type WebTool = { name:string; title:string; description:string; inputSchema:object; annotations:object; execute:(input:unknown)=>unknown };
    const context=(document as unknown as {modelContext?:{registerTool:(tool:WebTool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const register=(tool:WebTool)=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
    register({name:'list_customers',title:'查看客户列表',description:'读取当前 Demo 中的客户姓名、状态、预产期和预算。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({customers:customers.map(({id,name,status,dueDate,budgetMin,budgetMax})=>({id,name,status,dueDate,budgetMin,budgetMax}))})});
    register({name:'restore_demo_customers',title:'恢复演示客户',description:'清除本机新增客户并恢复初始的 10 条演示数据。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{reset();return{restored:true,count:mockCustomers.length}}});
    return()=>lifecycle.abort();
  },[customers]);
  if(!loggedIn) return <LoginView onLogin={()=>setLoggedIn(true)}/>;
  const selected=customers.find(c=>c.id===selectedId) ?? customers[0];
  return <><AppShell view={view} onNavigate={setView} onSoon={notify}>{view==='dashboard'&&<DashboardView customers={customers} onOpenCustomer={openCustomer} onAllCustomers={()=>setView('customers')}/>} {view==='customers'&&<CustomersView customers={customers} onOpen={openCustomer} onCreate={()=>setSheetOpen(true)} onReset={reset}/>} {view==='detail'&&<CustomerDetailView customer={selected} onBack={()=>setView('customers')} onSoon={notify}/>}</AppShell><NewCustomerSheet open={sheetOpen} onOpenChange={setSheetOpen} onSave={save}/>{message&&<div className="toast" role="status">{message}</div>}</>;
}
