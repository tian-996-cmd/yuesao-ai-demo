export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_service'
  | 'completed'
  | 'cancelled';
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
  price: number;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export type NewOrderInput = Omit<
  ServiceOrder,
  'id' | 'customerName' | 'workerName' | 'createdAt' | 'updatedAt'
> & { createSchedule?: boolean };
export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_service: '服务中',
  completed: '已完成',
  cancelled: '已取消',
};
