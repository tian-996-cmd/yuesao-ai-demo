import { nurseStatusStyles } from '@/lib/nurse-constants';
import type { NurseStatus } from '@/lib/nurse-types';
export function NurseStatusBadge({status}:{status:NurseStatus}){return <span className={`nurse-status ${nurseStatusStyles[status]}`}>{status==='空档'?'当前空档':status}</span>}
