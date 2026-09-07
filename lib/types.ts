export type CustomerStatus =
  | '新客户'
  | '待匹配'
  | '已推荐'
  | '待面试'
  | '待决定'
  | '已锁档'
  | '已签约';

export interface FollowUp {
  time: string;
  content: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  dueDate: string;
  budgetMin: number;
  budgetMax: number;
  parity: '第一胎' | '二胎' | '三胎' | '双胞胎';
  serviceDays: number;
  family: string;
  requirements: string[];
  exclusions: string[];
  originalNote: string;
  status: CustomerStatus;
  recommendedCount: number;
  consultant: string;
  lastFollowUp: string;
  followUps: FollowUp[];
}

export type NewCustomerInput = Pick<
  Customer,
  | 'name'
  | 'phone'
  | 'city'
  | 'dueDate'
  | 'budgetMin'
  | 'budgetMax'
  | 'serviceDays'
  | 'parity'
  | 'originalNote'
>;
