import { mockNurses } from '@/lib/mock-nurses';
import type { MaternityNurse } from '@/lib/nurse-types';
const KEY='yuesao-demo-nurses-v3';
const customerByName:Record<string,{id:string;city:string}>={'陈女士':{id:'chen',city:'西安'},'王女士':{id:'wang',city:'西安'},'刘女士':{id:'liu',city:'咸阳'},'赵女士':{id:'zhao',city:'西安'},'孙女士':{id:'sun',city:'西安'}};
const normalize=(items:MaternityNurse[])=>items.map(n=>({...n,schedule:n.schedule.map(s=>{const customer=s.customerName?customerByName[s.customerName]:undefined;return{...s,customerId:s.customerId??customer?.id,city:s.city??customer?.city}})}));
export const nurseService={load():MaternityNurse[]{if(typeof window==='undefined')return normalize(mockNurses);const raw=localStorage.getItem(KEY);if(!raw)return normalize(mockNurses);try{return normalize(JSON.parse(raw))}catch{return normalize(mockNurses)}},save(items:MaternityNurse[]){localStorage.setItem(KEY,JSON.stringify(items))},reset(){localStorage.removeItem(KEY);return normalize(mockNurses)}};
