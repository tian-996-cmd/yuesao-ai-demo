'use client';

import { useEffect, useState } from 'react';
import { AppShell, type ViewName } from '@/components/app-shell';
import { CustomerDetailView } from '@/components/customer-detail-view';
import { CustomersView } from '@/components/customers-view';
import { DashboardView } from '@/components/dashboard-view';
import { DemandParserSheet } from '@/components/demand-parser-sheet';
import { FollowupSheet } from '@/components/followup-sheet';
import { LoginView } from '@/components/login-view';
import { MatchingView } from '@/components/matching-view';
import { NewCustomerSheet } from '@/components/new-customer-sheet';
import { NurseDetailView } from '@/components/nurse-detail-view';
import { NurseFormSheet } from '@/components/nurse-form-sheet';
import { NursesView } from '@/components/nurses-view';
import { ScheduleView } from '@/components/schedule-view';
import { SettingsView } from '@/components/settings-view';
import { mockCustomers } from '@/lib/mock-data';
import { mockNurses } from '@/lib/mock-nurses';
import { mockMediaAssets } from '@/lib/mock-media';
import type { MediaAsset, MediaUploadMetadata } from '@/lib/media-types';
import type { MaternityNurse, NurseFormInput, NurseStatus } from '@/lib/nurse-types';
import type { Customer, DemandProfile, NewCustomerInput } from '@/lib/types';
import { addDays } from '@/lib/v3-engine';
import { customerService } from '@/services/customer-service';
import { nurseService } from '@/services/nurse-service';
import { mediaService } from '@/services/media-service';

export function DemoApp({initialView='dashboard'}:{initialView?:ViewName}) {
  const [loggedIn,setLoggedIn] = useState(false);
  const [view,setView] = useState<ViewName>(initialView);
  const [customers,setCustomers] = useState<Customer[]>(mockCustomers);
  const [nurses,setNurses] = useState<MaternityNurse[]>(mockNurses);
  const [media,setMedia] = useState<MediaAsset[]>(mockMediaAssets);
  const [selectedId,setSelectedId] = useState('wang');
  const [selectedNurseId,setSelectedNurseId] = useState('nurse_001');
  const [nurseFilter,setNurseFilter] = useState<NurseStatus>();
  const [focusNurseId,setFocusNurseId] = useState<string>();
  const [customerSheetOpen,setCustomerSheetOpen] = useState(false);
  const [nurseSheetOpen,setNurseSheetOpen] = useState(false);
  const [editingNurse,setEditingNurse] = useState<MaternityNurse>();
  const [message,setMessage] = useState('');
  const [demandOpen,setDemandOpen] = useState(false);
  const [followupOpen,setFollowupOpen] = useState(false);
  const [matchingCustomerId,setMatchingCustomerId] = useState('wang');

  useEffect(()=>{setCustomers(customerService.load());setNurses(nurseService.load());void mediaService.listAll().then(setMedia);const parts=window.location.pathname.split('/').filter(Boolean);if(parts[0]==='nurses'&&parts[1])setSelectedNurseId(parts[1]);if(parts[0]==='customers'&&parts[1])setSelectedId(parts[1])},[]);
  const showMessage=(text:string)=>{setMessage(text);window.setTimeout(()=>setMessage(''),2600)};
  const persistCustomers=(next:Customer[])=>{setCustomers(next);customerService.save(next)};
  const persistNurses=(next:MaternityNurse[])=>{setNurses(next);nurseService.save(next)};
  const pathFor=(next:ViewName)=>next==='dashboard'?'/' : next==='customers'?'/customers' : next==='nurses'?'/nurses' : next==='schedule'?'/schedule' : next==='matching'?'/matching' : next==='settings'?'/settings' : window.location.pathname;
  const navigate=(next:ViewName)=>{setView(next);window.history.pushState({},'',pathFor(next));window.scrollTo(0,0)};
  const openCustomer=(id:string)=>{setSelectedId(id);setView('detail');window.history.pushState({},'',`/customers/${id}`);window.scrollTo(0,0)};
  const openNurse=(id:string)=>{setSelectedNurseId(id);setView('nurseDetail');window.history.pushState({},'',`/nurses/${id}`);window.scrollTo(0,0)};
  const openSchedule=(id?:string)=>{setFocusNurseId(id);setView('schedule');window.history.pushState({},'',id?`/schedule?nurse=${id}`:'/schedule');window.scrollTo(0,0)};
  const openMatching=(id?:string)=>{if(id)setMatchingCustomerId(id);setView('matching');window.history.pushState({},'','/matching');window.scrollTo(0,0)};
  const notify=(name:string)=>showMessage(`${name}已记录在演示流程中`);
  const saveCustomer=(input:NewCustomerInput)=>{const item:Customer={...input,id:`local-${Date.now()}`,phone:input.phone.replace(/(\d{3})\d+(\d{4})/,'$1****$2'),family:'待补充家庭情况。',requirements:[],exclusions:[],status:'新客户',recommendedCount:0,consultant:'王敏',lastFollowUp:'刚刚',followUps:[{time:'刚刚',content:'新建客户档案。'}]};persistCustomers([item,...customers]);showMessage('客户已保存到本地列表')};
  const saveNurse=(input:NurseFormInput)=>{
    if(editingNurse){persistNurses(nurses.map(n=>n.id===editingNurse.id?{...n,...input}:n));showMessage('月嫂资料已更新')}
    else {const id=`local-nurse-${Date.now()}`;const item:MaternityNurse={...input,id,status:'空档',specialExperienceTags:[],ratings:{overall:4.8,newbornCare:8.5,postpartumCare:8.5,cooking:8.2,communication:8.6,boundarySense:8.5,nightCare:8.4},serviceHistory:[],reviews:[],schedule:[]};persistNurses([item,...nurses]);showMessage('月嫂已保存到本地人才库')}
    setEditingNurse(undefined);
  };
  const updateCustomer=(id:string,change:(c:Customer)=>Customer)=>persistCustomers(customers.map(c=>c.id===id?change(c):c));
  const applyDemand=(profile:DemandProfile)=>{updateCustomer(selected.id,c=>({...c,demandProfile:profile,requirements:profile.mustHaves,exclusions:profile.exclusions,lastFollowUp:'刚刚',followUps:[{time:'09月07日 14:30',content:'AI 已整理客户需求并写入档案。'},...c.followUps]}));showMessage('结构化需求已写入客户档案')};
  const addFollowup=(content:string)=>{updateCustomer(selected.id,c=>({...c,lastFollowUp:'刚刚',followUps:[{time:'09月07日 14:35',content},...c.followUps]}));showMessage('跟进记录已同步到工作台')};
  const recommend=(ids:string[])=>{updateCustomer(matchingCustomerId,c=>({...c,status:'已推荐',recommendedCount:ids.length,recommendedNurseIds:ids,lastFollowUp:'刚刚',followUps:[{time:'09月07日 14:40',content:`已向客户推荐 ${ids.length} 位候选月嫂。`},...c.followUps]}));showMessage('候选人已推荐给客户')};
  const lock=(nurseId:string)=>{const customer=customers.find(c=>c.id===matchingCustomerId)??customers[0];const end=addDays(customer.dueDate,customer.serviceDays-1);updateCustomer(customer.id,c=>({...c,status:'已锁定',lockedNurseId:nurseId,lastFollowUp:'刚刚',followUps:[{time:'09月07日 14:45',content:'客户确认人选，服务档期已锁定。'},...c.followUps]}));persistNurses(nurses.map(n=>n.id===nurseId?{...n,status:'已锁档',availableFrom:addDays(end,4),schedule:[...n.schedule,{id:`locked-${customer.id}-${Date.now()}`,nurseId:n.id,customerId:customer.id,customerName:customer.name,city:customer.city,start:customer.dueDate,end,status:'已锁档',note:'由智能匹配中心锁定'}]}:n));showMessage('档期已锁定，并同步到档期中心和工作台')};
  const addNurseSchedule=()=>{const start=selectedNurse.availableFrom,end=addDays(start,25);persistNurses(nurses.map(n=>n.id===selectedNurse.id?{...n,status:'已锁档',availableFrom:addDays(end,4),schedule:[...n.schedule,{id:`manual-${Date.now()}`,nurseId:n.id,start,end,status:'已锁档',note:'顾问新增档期'}]}:n));showMessage('新档期已加入排期中心')};
  const uploadMedia=async(files:File[],metadata:MediaUploadMetadata)=>{setMedia(await mediaService.upload(files,metadata));showMessage(`${files.length} 张照片已保存到当前浏览器`)};
  const deleteMedia=async(id:string)=>{setMedia(await mediaService.delete(id));showMessage('照片已删除，关联服务记录保持不变')};
  const updateMedia=async(id:string,patch:Partial<MediaAsset>)=>{setMedia(await mediaService.updateMetadata(id,patch));showMessage('照片信息已更新')};
  const setAvatar=async(id:string)=>{setMedia(await mediaService.setAvatar(id));showMessage('头像已更新，原头像已保留为形象照')};
  const reset=()=>{setCustomers(customerService.reset());setNurses(nurseService.reset());setMedia(mediaService.reset());setSelectedId('wang');setSelectedNurseId('nurse_001');showMessage('客户、月嫂与相册演示数据已恢复')};

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
  return <>
    <AppShell view={view} onNavigate={navigate} onSoon={notify}>
      {view==='dashboard'&&<DashboardView customers={customers} nurses={nurses} onOpenCustomer={openCustomer} onCreateCustomer={()=>setCustomerSheetOpen(true)} onMatching={openMatching} onSchedule={()=>openSchedule('nurse_002')} onParse={id=>{setSelectedId(id);setDemandOpen(true)}}/>} 
      {view==='customers'&&<CustomersView customers={customers} onOpen={openCustomer} onCreate={()=>setCustomerSheetOpen(true)} onMatch={openMatching}/>} 
      {view==='detail'&&<CustomerDetailView customer={selected} nurses={nurses} onBack={()=>navigate('customers')} onFollow={()=>setFollowupOpen(true)} onParse={()=>setDemandOpen(true)} onMatch={()=>openMatching(selected.id)} onOpenNurse={openNurse}/>} 
      {view==='nurses'&&<NursesView nurses={nurses} media={media} initialFilter={nurseFilter} onOpen={openNurse} onCreate={()=>{setEditingNurse(undefined);setNurseSheetOpen(true)}}/>}
      {view==='nurseDetail'&&<NurseDetailView nurse={selectedNurse} media={media} onBack={()=>navigate('nurses')} onEdit={()=>{setEditingNurse(selectedNurse);setNurseSheetOpen(true)}} onSchedule={()=>openSchedule(selectedNurse.id)} onRecommend={()=>openMatching()} onAddSchedule={addNurseSchedule} onUpload={uploadMedia} onDeleteMedia={deleteMedia} onUpdateMedia={updateMedia} onSetAvatar={setAvatar}/>}
      {view==='schedule'&&<ScheduleView nurses={nurses} customers={customers} focusNurseId={focusNurseId} onOpenNurse={openNurse} onOpenCustomer={openCustomer}/>} 
      {view==='matching'&&<MatchingView customers={customers} nurses={nurses} media={media} customerId={matchingCustomerId} onSelectCustomer={setMatchingCustomerId} onOpenNurse={openNurse} onParse={()=>{setSelectedId(matchingCustomerId);setDemandOpen(true)}} onRecommend={recommend} onLock={lock}/>}
      {view==='settings'&&<SettingsView onReset={reset}/>} 
    </AppShell>
    <NewCustomerSheet open={customerSheetOpen} onOpenChange={setCustomerSheetOpen} onSave={saveCustomer}/>
    <NurseFormSheet open={nurseSheetOpen} onOpenChange={x=>{setNurseSheetOpen(x);if(!x)setEditingNurse(undefined)}} onSave={saveNurse} editing={editingNurse}/>
    <DemandParserSheet open={demandOpen} onOpenChange={setDemandOpen} customer={selected} onApply={applyDemand}/>
    <FollowupSheet open={followupOpen} onOpenChange={setFollowupOpen} onSave={addFollowup}/>
    {message&&<output className="toast">{message}</output>}
  </>;
}

export default function Home(){return <DemoApp/>}
