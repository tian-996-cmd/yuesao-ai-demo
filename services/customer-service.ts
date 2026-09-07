import { mockCustomers } from '@/lib/mock-data';
import type { Customer } from '@/lib/types';
const KEY='yuesao-demo-customers-v3';
const recommended:Record<string,string[]>={wang:['nurse_003','nurse_006','nurse_009'],zhang:['nurse_009','nurse_018'],liu:['nurse_001','nurse_004','nurse_010']};
const locked:Record<string,string>={zhao:'nurse_005'};
const normalize=(items:Customer[])=>items.map(c=>({...c,status:c.status==='待面试'||c.status==='待决定'?'沟通中':c.status==='已锁档'||c.status==='已签约'?'已锁定':c.status,recommendedNurseIds:c.recommendedNurseIds??recommended[c.id],lockedNurseId:c.lockedNurseId??locked[c.id]})) as Customer[];
export const customerService={load():Customer[]{if(typeof window==='undefined')return normalize(mockCustomers);const raw=localStorage.getItem(KEY);if(!raw)return normalize(mockCustomers);try{return normalize(JSON.parse(raw))}catch{return normalize(mockCustomers)}},save(items:Customer[]){localStorage.setItem(KEY,JSON.stringify(items))},reset(){localStorage.removeItem(KEY);return normalize(mockCustomers)}};
