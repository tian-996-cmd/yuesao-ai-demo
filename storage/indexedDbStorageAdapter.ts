import type {StorageAdapter} from './storageAdapter';

const DB='yuesao-demo-media-v1',STORE='files';
function openDb(){return new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function transact(mode:IDBTransactionMode,key:string,value?:Blob){const db=await openDb();return new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,mode);const store=tx.objectStore(STORE);value?store.put(value,key):store.delete(key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
export class IndexedDbStorageAdapter implements StorageAdapter{
  uploadFile(key:string,file:Blob){return transact('readwrite',key,file)}
  deleteFile(key:string){return transact('readwrite',key)}
  async getFileUrl(key:string){const db=await openDb();return new Promise<string|undefined>((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const request=tx.objectStore(STORE).get(key);request.onsuccess=()=>{db.close();resolve(request.result?URL.createObjectURL(request.result):undefined)};request.onerror=()=>{db.close();reject(request.error)}})}
  getSignedUrl(key:string){return this.getFileUrl(key)}
}
