import { statusStyles } from '@/lib/status';
import type { CustomerStatus, LegacyCustomerStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: CustomerStatus|LegacyCustomerStatus }) {
  const canonical=status==='待面试'||status==='待决定'?'沟通中':status==='已锁档'||status==='已签约'?'已锁定':status;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[canonical]}`}>{canonical}</span>;
}
