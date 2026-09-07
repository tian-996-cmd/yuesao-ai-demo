import { mockCustomers } from '@/lib/mock-data';
import type { Customer } from '@/lib/types';
const KEY='yuesao-demo-customers-v1';
export const customerService={load():Customer[]{if(typeof window==='undefined')return mockCustomers;const raw=localStorage.getItem(KEY);if(!raw)return mockCustomers;try{return JSON.parse(raw)}catch{return mockCustomers}},save(items:Customer[]){localStorage.setItem(KEY,JSON.stringify(items))},reset(){localStorage.removeItem(KEY);return mockCustomers}};
