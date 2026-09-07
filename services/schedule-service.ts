import type { MaternityNurse, NurseSchedule } from '@/lib/nurse-types';
export const scheduleService={all(nurses:MaternityNurse[]):NurseSchedule[]{return nurses.flatMap(n=>n.schedule)},forNurse(nurses:MaternityNurse[],id:string){return nurses.find(n=>n.id===id)?.schedule??[]}};
