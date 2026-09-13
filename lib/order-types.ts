export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_service'
  | 'completed'
  | 'cancelled';
export type PaymentStatus =
  | 'unpaid'
  | 'partial_paid'
  | 'pending_final'
  | 'overdue'
  | 'paid';
export type PaymentType = 'deposit' | 'final' | 'partial' | 'other';
export type PaymentMethod =
  | 'cash'
  | 'wechat'
  | 'alipay'
  | 'bank_transfer'
  | 'other';
export interface PaymentSummary {
  totalAmount: number;
  depositAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  finalPaymentDueDate: string | null;
  paymentStatus: PaymentStatus;
  overdueDays: number;
}
export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paidAt: string;
  remark?: string | null;
  creatorName?: string;
  createdAt?: string;
  deletedAt?: string | null;
  voided?: boolean;
}
export interface ServiceOrder {
  id: string;
  customerId: string;
  workerId?: string | null;
  customerName?: string;
  workerName?: string | null;
  serviceType: string;
  status: OrderStatus;
  startDate: string;
  endDate: string;
  totalAmount: number;
  depositAmount: number;
  finalPaymentDueDate?: string | null;
  paymentSummary: PaymentSummary;
  payments?: PaymentRecord[];
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export type NewOrderInput = Omit<
  ServiceOrder,
  | 'id'
  | 'customerName'
  | 'workerName'
  | 'paymentSummary'
  | 'payments'
  | 'createdAt'
  | 'updatedAt'
> & { createSchedule?: boolean };
export type NewPaymentInput = Pick<
  PaymentRecord,
  'amount' | 'paymentType' | 'paymentMethod' | 'paidAt' | 'remark'
>;
export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_service: '服务中',
  completed: '已完成',
  cancelled: '已取消',
};
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: '未付款',
  partial_paid: '部分付款',
  pending_final: '已付定金 / 待付尾款',
  overdue: '尾款逾期',
  paid: '已结清',
};
export const paymentTypeLabels: Record<PaymentType, string> = {
  deposit: '定金',
  final: '尾款',
  partial: '部分收款',
  other: '其他收款',
};
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  bank_transfer: '银行转账',
  other: '其他',
};
