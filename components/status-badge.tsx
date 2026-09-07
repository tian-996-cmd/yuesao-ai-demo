import { statusStyles } from '@/lib/status';
import type { CustomerStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>{status}</span>;
}
