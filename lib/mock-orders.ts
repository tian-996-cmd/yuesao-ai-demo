import type { ServiceOrder } from './order-types';
export const mockOrders: ServiceOrder[] = [
  {
    id: 'demo-order-001',
    customerId: 'zhao',
    workerId: 'nurse_005',
    customerName: '赵女士',
    workerName: '周萍',
    serviceType: '月嫂服务',
    status: 'confirmed',
    startDate: '2026-10-18',
    endDate: '2026-11-12',
    price: 16800,
    remark: '演示订单',
  },
  {
    id: 'demo-order-002',
    customerId: 'wang',
    workerId: null,
    customerName: '王女士',
    workerName: null,
    serviceType: '月嫂服务',
    status: 'pending',
    startDate: '2026-11-18',
    endDate: '2026-12-13',
    price: 16000,
    remark: '等待匹配人员',
  },
];
