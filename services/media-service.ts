import {mockMediaAssets} from '@/lib/mock-media';
import type {MediaAsset,MediaUploadMetadata} from '@/lib/media-types';
import {IndexedDbStorageAdapter} from '@/storage/indexedDbStorageAdapter';

const KEY='yuesao-demo-media-metadata-v1';
const storage=new IndexedDbStorageAdapter();
const supported=new Set(['image/jpeg','image/png','image/webp']);
const cloneDefaults=()=>mockMediaAssets.map(x=>({...x}));

function metadata(){if(typeof window==='undefined')return cloneDefaults();const raw=localStorage.getItem(KEY);if(!raw)return cloneDefaults();try{return JSON.parse(raw) as MediaAsset[]}catch{return cloneDefaults()}}
function save(items:MediaAsset[]){localStorage.setItem(KEY,JSON.stringify(items.map(x=>({...x,url:x.url?.startsWith('blob:')?undefined:x.url,thumbnailUrl:x.thumbnailUrl?.startsWith('blob:')?undefined:x.thumbnailUrl}))))}
async function hydrate(items:MediaAsset[]){return Promise.all(items.map(async x=>{if(!x.storageKey)return x;const [url,thumbnailUrl]=await Promise.all([storage.getFileUrl(x.storageKey),storage.getFileUrl(`${x.storageKey}:thumb`)]);return{...x,url,thumbnailUrl:thumbnailUrl??url}}))}
async function reencode(file:File,max:number,quality=.82){const bitmap=await createImageBitmap(file);const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')?.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('图片压缩失败')),'image/webp',quality));return{blob,width:canvas.width,height:canvas.height}}

export const mediaService={
  async listAll(){return hydrate(metadata())},
  async listByNurse(nurseId:string){return (await this.listAll()).filter(x=>x.nurseId===nurseId)},
  async listByServiceRecord(serviceRecordId:string){return (await this.listAll()).filter(x=>x.serviceRecordId===serviceRecordId)},
  async upload(files:File[],data:MediaUploadMetadata){
    if(files.length>20)throw new Error('一次最多上传20张图片');
    const current=metadata(),created:MediaAsset[]=[];
    for(const [index,file] of files.entries()){
      if(!supported.has(file.type))throw new Error('仅支持 JPG、PNG、WEBP');
      if(file.size>10*1024*1024)throw new Error('单张图片需小于10MB');
      const id=crypto.randomUUID(),folder=data.category==='service_case'?`service-cases/${data.serviceRecordId??'unlinked'}`:data.category;
      const storageKey=`companies/company_001/nurses/${data.nurseId}/${folder}/${id}.webp`;
      const [full,thumb]=await Promise.all([reencode(file,1600,.83),reencode(file,400,.78)]);
      await Promise.all([storage.uploadFile(storageKey,full.blob),storage.uploadFile(`${storageKey}:thumb`,thumb.blob)]);
      created.push({id,nurseId:data.nurseId,serviceRecordId:data.serviceRecordId,category:data.category,title:data.title||file.name.replace(/\.[^.]+$/,''),caption:data.caption,tag:data.tag,fileName:file.name,mimeType:'image/webp',width:full.width,height:full.height,fileSize:full.blob.size,storageKey,visibility:data.visibility,consentStatus:data.category==='service_case'?(data.visibility==='customer_shareable'?'confirmed':'unknown'):'not_required',sortOrder:current.length+index,createdAt:new Date().toISOString()});
    }
    const next=[...current,...created];save(next);return hydrate(next);
  },
  async setAvatar(mediaId:string){const items=metadata(),target=items.find(x=>x.id===mediaId);if(!target)return hydrate(items);const next=items.map(x=>x.nurseId!==target.nurseId?x:x.id===mediaId?{...x,category:'avatar' as const,updatedAt:new Date().toISOString()}:x.category==='avatar'?{...x,category:'profile' as const,updatedAt:new Date().toISOString()}:x);save(next);return hydrate(next)},
  async updateMetadata(mediaId:string,patch:Partial<Pick<MediaAsset,'title'|'caption'|'category'|'visibility'|'serviceRecordId'|'tag'>>){const items=metadata();const next=items.map(x=>x.id===mediaId?{...x,...patch,consentStatus:patch.visibility==='customer_shareable'&&x.category==='service_case'?'confirmed':x.consentStatus,updatedAt:new Date().toISOString()}:x);save(next);return hydrate(next)},
  async delete(mediaId:string){const items=metadata(),target=items.find(x=>x.id===mediaId);if(target?.storageKey)await Promise.all([storage.deleteFile(target.storageKey),storage.deleteFile(`${target.storageKey}:thumb`)]);const next=items.filter(x=>x.id!==mediaId);save(next);return hydrate(next)},
  async getUrl(mediaId:string){const item=(await this.listAll()).find(x=>x.id===mediaId);return item?.url},
  async getThumbnailUrl(mediaId:string){const item=(await this.listAll()).find(x=>x.id===mediaId);return item?.thumbnailUrl??item?.url},
  reset(){localStorage.removeItem(KEY);return cloneDefaults()}
};
