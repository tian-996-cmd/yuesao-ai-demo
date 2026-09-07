import type { CustomerStatus } from './types';
export const customerStatuses:CustomerStatus[]=['新客户','待匹配','已推荐','沟通中','已锁定','服务中','已完成'];
export const statusStyles:Record<CustomerStatus,string>={新客户:'bg-sky-50 text-sky-700 ring-sky-200',待匹配:'bg-amber-50 text-amber-700 ring-amber-200',已推荐:'bg-indigo-50 text-indigo-700 ring-indigo-200',沟通中:'bg-violet-50 text-violet-700 ring-violet-200',已锁定:'bg-orange-50 text-orange-700 ring-orange-200',服务中:'bg-purple-50 text-purple-700 ring-purple-200',已完成:'bg-emerald-50 text-emerald-700 ring-emerald-200'};
