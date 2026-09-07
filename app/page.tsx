'use client';

import { useEffect, useState } from 'react';
import { AppShell, type ViewName } from '@/components/app-shell';
import { CustomerDetailView } from '@/components/customer-detail-view';
import { CustomersView } from '@/components/customers-view';
import { DashboardView } from '@/components/dashboard-view';
import { LoginView } from '@/components/login-view';
import { NewCustomerSheet } from '@/components/new-customer-sheet';
import { NurseDetailView } from '@/components/nurse-detail-view';
import { NurseFormSheet } from '@/components/nurse-form-sheet';
import { NursesView } from '@/components/nurses-view';
import { ScheduleView } from '@/components/schedule-view';
import { SettingsView } from '@/components/settings-view';
import { mockCustomers } from '@/lib/mock-data';
import { mockNurses } from '@/lib/mock-nurses';
import type { MaternityNurse, NurseFormInput, NurseStatus } from '@/lib/nurse-types';
import type { Customer, NewCustomerInput } from '@/lib/types';
import { customerService } from '@/services/customer-service';
import { nurseService } from '@/services/nurse-service';

export function DemoApp({initialView='dashboard'}:{initialView?:ViewName}) {
  const [loggedIn,setLoggedIn] = useState(false);
  const [view,setView] = useState<ViewName>(initialView);
  const [customers,setCustomers] = useState<Customer[]>(mockCustomers);
  const [nurses,setNurses] = useState<MaternityNurse[]>(mockNurses);
  const [selectedId,setSelectedId] = useState('wang');
  const [selectedNurseId,setSelectedNurseId] = useState('nurse_001');
  const [nurseFilter,setNurseFilter] = useState<NurseStatus>();
  const [focusNurseId,setFocusNurseId] = useState<string>();
  const [customerSheetOpen,setCustomerSheetOpen] = useState(false);
  const [nurseSheetOpen,setNurseSheetOpen] = useState(false);
  const [editingNurse,setEditingNurse] = useState<MaternityNurse>();
  const [message,setMessage] = useState('');

  useEffect(()=>{setCustomers(customerService.load());setNurses(nurseService.load());const parts=window.location.pathname.split('/').filter(Boolean);if(parts[0]==='nurses'&&parts[1])setSelectedNurseId(parts[1]);if(parts[0]==='customers'&&parts[1])setSelectedId(parts[1])},[]);
  const showMessage=(text:string)=>{setMessage(text);window.setTimeout(()=>setMessage(''),2600)};
  const persistCustomers=(next:Customer[])=>{setCustomers(next);customerService.save(next)};
  const persistNurses=(next:MaternityNurse[])=>{setNurses(next);nurseService.save(next)};
  const pathFor=(next:ViewName)=>next==='dashboard'?'/' : next==='customers'?'/customers' : next==='nurses'?'/nurses' : next==='schedule'?'/schedule' : next==='settings'?'/settings' : window.location.pathname;
  const navigate=(next:ViewName)=>{setView(next);window.history.pushState({},'',pathFor(next));window.scrollTo(0,0)};
  const openCustomer=(id:string)=>{setSelectedId(id);setView('detail');window.history.pushState({},'',`/customers/${id}`);window.scrollTo(0,0)};
  const openNurse=(id:string)=>{setSelectedNurseId(id);setView('nurseDetail');window.history.pushState({},'',`/nurses/${id}`);window.scrollTo(0,0)};
  const openSchedule=(id?:string)=>{setFocusNurseId(id);setView('schedule');window.history.pushState({},'',id?`/schedule?nurse=${id}`:'/schedule');window.scrollTo(0,0)};
  const notify=(name:string)=>{showMessage(['AI 匹配','重新匹配','推荐给客户'].includes(name)?'智能推荐功能将在下一阶段加入。':`${name}功能将在后续 Demo 中加入。`)};
  const saveCustomer=(input:NewCustomerInput)=>{const item:Customer={...input,id:`local-${Date.now()}`,phone:input.phone.replace(/(\d{3})\d+(\d{4})/,'$1****$2'),family:'待补充家庭情况。',requirements:[],exclusions:[],status:'新客户',recommendedCount:0,consultant:'王敏',lastFollowUp:'刚刚',followUps:[{time:'刚刚',content:'新建客户档案。'}]};persistCustomers([item,...customers]);showMessage('客户已保存到本地列表')};
  const saveNurse=(input:NurseFormInput)=>{
    if(editingNurse){persistNurses(nurses.map(n=>n.id===editingNurse.id?{...n,...input}:n));showMessage('月嫂资料已更新')}
    else {const id=`local-nurse-${Date.now()}`;const item:MaternityNurse={...input,id,status:'空档',specialExperienceTags:[],ratings:{overall:4.8,newbornCare:8.5,postpartumCare:8.5,cooking:8.2,communication:8.6,boundarySense:8.5,nightCare:8.4},serviceHistory:[],reviews:[],schedule:[]};persistNurses([item,...nurses]);showMessage('月嫂已保存到本地人才库')}
    setEditingNurse(undefined);
  };
  const reset=()=>{setCustomers(customerService.reset());setNurses(nurseService.reset());setSelectedId('wang');setSelectedNurseId('nurse_001');showMessage('客户与月嫂演示数据已恢复')};

  useEffect(()=>{
    type WebTool = { name:string; title:string; description:string; inputSchema:object; annotations:object; execute:(input:unknown)=>unknown };
    const context=(document as unknown as {modelContext?:{registerTool:(tool:WebTool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const register=(tool:WebTool)=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}}
    register({name:'list_customers',title:'查看客户列表',description:'读取当前 Demo 中的客户姓名、状态、预产期和预算。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({customers:customers.map(({id,name,status,dueDate,budgetMin,budgetMax})=>({id,name,status,dueDate,budgetMin,budgetMax}))})});
    register({name:'list_maternity_nurses',title:'查看月嫂列表',description:'读取当前 Demo 的月嫂姓名、状态、技能、价格和最近可上户日期。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({nurses:nurses.map(({id,name,status,skillTags,price26Days,availableFrom})=>({id,name,status,skillTags,price26Days,availableFrom}))})});
    register({name:'restore_demo_data',title:'恢复演示数据',description:'清除本机新增和编辑内容，恢复初始客户与月嫂演示数据。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{reset();return{restored:true,customers:mockCustomers.length,nurses:mockNurses.length}}});
    return()=>lifecycle.abort();
  },[customers,nurses]);

  if(!loggedIn) return <LoginView onLogin={()=>setLoggedIn(true)}/>;
  const selected=customers.find(c=>c.id===selectedId) ?? customers[0];
  const selectedNurse=nurses.find(n=>n.id===selectedNurseId) ?? nurses[0];
  const freeNurseCount=nurses.filter(n=>n.status==='空档').length;
  return <>
    <AppShell view={view} onNavigate={navigate} onSoon={notify}>
      {view==='dashboard'&&<DashboardView customers={customers} freeNurseCount={freeNurseCount} onOpenCustomer={openCustomer} onAllCustomers={()=>navigate('customers')} onCreateCustomer={()=>setCustomerSheetOpen(true)} onFreeNurses={()=>{setNurseFilter('空档');navigate('nurses')}} onSchedule={()=>openSchedule('nurse_002')} onSoon={notify}/>} 
      {view==='customers'&&<CustomersView customers={customers} onOpen={openCustomer} onCreate={()=>setCustomerSheetOpen(true)}/>} 
      {view==='detail'&&<CustomerDetailView customer={selected} onBack={()=>navigate('customers')} onSoon={notify}/>} 
      {view==='nurses'&&<NursesView nurses={nurses} initialFilter={nurseFilter} onOpen={openNurse} onCreate={()=>{setEditingNurse(undefined);setNurseSheetOpen(true)}}/>}
      {view==='nurseDetail'&&<NurseDetailView nurse={selectedNurse} onBack={()=>navigate('nurses')} onEdit={()=>{setEditingNurse(selectedNurse);setNurseSheetOpen(true)}} onSchedule={()=>openSchedule(selectedNurse.id)} onSoon={notify}/>} 
      {view==='schedule'&&<ScheduleView nurses={nurses} focusNurseId={focusNurseId} onOpenNurse={openNurse}/>} 
      {view==='settings'&&<SettingsView onReset={reset}/>} 
    </AppShell>
    <NewCustomerSheet open={customerSheetOpen} onOpenChange={setCustomerSheetOpen} onSave={saveCustomer}/>
    <NurseFormSheet open={nurseSheetOpen} onOpenChange={x=>{setNurseSheetOpen(x);if(!x)setEditingNurse(undefined)}} onSave={saveNurse} editing={editingNurse}/>
    {message&&<output className="toast">{message}</output>}
  </>;
}

export default function Home(){return <DemoApp/>}
