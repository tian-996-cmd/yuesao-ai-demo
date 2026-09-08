'use client';

import {ChevronLeft,ChevronRight,Eye,ImagePlus,LockKeyhole,Trash2,UserRoundCheck} from 'lucide-react';
import {useEffect,useMemo,useState} from 'react';
import type {MediaAsset,MediaCategory,MediaUploadMetadata} from '@/lib/media-types';
import type {MaternityNurse} from '@/lib/nurse-types';
import {Button} from './ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from './ui/dialog';
import {Input} from './ui/input';
import {MediaUploadSheet} from './media-upload-sheet';

type Filter='all'|'profile'|'service_case'|'cooking';
const labels:Record<Filter,string>={all:'全部',profile:'形象照',service_case:'服务案例',cooking:'月子餐'};
const categoryLabels:Record<MediaCategory,string>={avatar:'头像',profile:'形象照',service_case:'服务案例',cooking:'月子餐',certificate:'资料 / 证书'};

type Props={nurse:MaternityNurse;media:MediaAsset[];initialFilter?:Filter;serviceRecordId?:string;onUpload:(files:File[],metadata:MediaUploadMetadata)=>Promise<void>;onDelete:(id:string)=>Promise<void>;onUpdate:(id:string,patch:Partial<MediaAsset>)=>Promise<void>;onSetAvatar:(id:string)=>Promise<void>};

export function NurseGallery({nurse,media,initialFilter='all',serviceRecordId,onUpload,onDelete,onUpdate,onSetAvatar}:Props){
  const [filter,setFilter]=useState<Filter>(initialFilter),[selectedId,setSelectedId]=useState<string>(),[upload,setUpload]=useState(false),[caption,setCaption]=useState('');
  useEffect(()=>setFilter(initialFilter),[initialFilter]);
  const items=useMemo(()=>media.filter(x=>x.nurseId===nurse.id&&x.category!=='avatar'&&(filter==='all'||x.category===filter)&&(!serviceRecordId||x.serviceRecordId===serviceRecordId)).sort((a,b)=>a.sortOrder-b.sortOrder),[media,nurse.id,filter,serviceRecordId]);
  const selected=items.find(x=>x.id===selectedId),index=selected?items.indexOf(selected):-1;
  useEffect(()=>setCaption(selected?.caption??''),[selectedId,selected?.caption]);
  const move=(delta:number)=>{if(items.length)setSelectedId(items[(index+delta+items.length)%items.length].id)};
  return <div className="nurse-gallery">
    <header><div><h2>相册</h2><p>展示月嫂形象、服务案例和月子餐作品。</p></div><Button className="primary-button" onClick={()=>setUpload(true)}><ImagePlus/>上传照片</Button></header>
    <div className="gallery-filters">{(Object.keys(labels) as Filter[]).map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{labels[x]}</button>)}</div>
    {items.length?<div className="media-grid">{items.map(x=>{const record=nurse.serviceHistory.find(r=>r.id===x.serviceRecordId);return <button key={x.id} onClick={()=>setSelectedId(x.id)}><img src={x.thumbnailUrl??x.url} alt={x.title??categoryLabels[x.category]} loading="lazy"/><span><strong>{x.title??categoryLabels[x.category]}</strong><small>{x.tag??(record?`${record.month} · ${record.city}`:categoryLabels[x.category])}</small></span><i title={x.visibility==='internal'?'仅内部可见':'可向客户展示'}>{x.visibility==='internal'?<LockKeyhole/>:<Eye/>}</i></button>})}</div>:<div className="media-empty"><ImagePlus/><h3>还没有{filter==='all'?'照片':labels[filter]}</h3><p>上传后会保存在当前浏览器并显示在这里。</p><Button variant="outline" onClick={()=>setUpload(true)}>上传照片</Button></div>}
    <Dialog open={!!selected} onOpenChange={x=>!x&&setSelectedId(undefined)}><DialogContent className="media-lightbox"><DialogHeader><DialogTitle>{selected?.title??'照片预览'}</DialogTitle><DialogDescription>{selected&&categoryLabels[selected.category]} · {selected?.createdAt.slice(0,10)}</DialogDescription></DialogHeader>{selected&&<>
      <div className="lightbox-image"><img src={selected.url??selected.thumbnailUrl} alt={selected.title??'照片预览'}/>{items.length>1&&<><button className="prev" aria-label="上一张" onClick={()=>move(-1)}><ChevronLeft/></button><button className="next" aria-label="下一张" onClick={()=>move(1)}><ChevronRight/></button></>}</div>
      {selected.serviceRecordId&&(()=>{const r=nurse.serviceHistory.find(x=>x.id===selected.serviceRecordId);return r?<p className="linked-service">所属服务：{r.month} · {r.city} · {r.familyType} · {r.days}天</p>:null})()}
      <div className="lightbox-fields"><label>图片类型<select value={selected.category} onChange={e=>onUpdate(selected.id,{category:e.target.value as MediaCategory})}><option value="profile">形象照</option><option value="service_case">服务案例</option><option value="cooking">月子餐</option></select></label><label>关联服务<select value={selected.serviceRecordId??''} onChange={e=>onUpdate(selected.id,{serviceRecordId:e.target.value||undefined})}><option value="">不关联</option>{nurse.serviceHistory.map(r=><option key={r.id} value={r.id}>{r.month} · {r.city}</option>)}</select></label></div>
      <div className="lightbox-meta"><Input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="图片说明"/><Button variant="outline" onClick={()=>onUpdate(selected.id,{caption})}>保存说明</Button></div>
      <div className="lightbox-actions">{selected.category==='profile'&&<Button variant="outline" onClick={()=>onSetAvatar(selected.id)}><UserRoundCheck/>设为头像</Button>}<Button variant="outline" onClick={()=>onUpdate(selected.id,{visibility:selected.visibility==='internal'?'customer_shareable':'internal'})}>{selected.visibility==='internal'?<><Eye/>设为可向客户展示</>:<><LockKeyhole/>改为仅内部</>}</Button><Button variant="outline" onClick={async()=>{if(confirm('确认删除这张照片？')){await onDelete(selected.id);setSelectedId(undefined)}}}><Trash2/>删除</Button></div>
    </>}</DialogContent></Dialog>
    <MediaUploadSheet open={upload} onOpenChange={setUpload} nurse={nurse} onSave={onUpload}/>
  </div>;
}
