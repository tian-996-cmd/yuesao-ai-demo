import { mockNurses } from '@/lib/mock-nurses';
import type { MaternityNurse } from '@/lib/nurse-types';
const KEY='yuesao-demo-nurses-v2';
export const nurseService={load():MaternityNurse[]{if(typeof window==='undefined')return mockNurses;const raw=localStorage.getItem(KEY);if(!raw)return mockNurses;try{return JSON.parse(raw)}catch{return mockNurses}},save(items:MaternityNurse[]){localStorage.setItem(KEY,JSON.stringify(items))},reset(){localStorage.removeItem(KEY);return mockNurses}};
