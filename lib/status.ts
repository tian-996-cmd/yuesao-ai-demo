import type { CustomerStatus } from './types';

export const customerStatuses: CustomerStatus[] = [
  '新客户', '待匹配', '已推荐', '待面试', '待决定', '已锁档', '已签约',
];

export const statusStyles: Record<CustomerStatus, string> = {
  新客户: 'bg-sky-50 text-sky-700 ring-sky-200',
  待匹配: 'bg-amber-50 text-amber-700 ring-amber-200',
  已推荐: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  待面试: 'bg-violet-50 text-violet-700 ring-violet-200',
  待决定: 'bg-orange-50 text-orange-700 ring-orange-200',
  已锁档: 'bg-teal-50 text-teal-700 ring-teal-200',
  已签约: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
