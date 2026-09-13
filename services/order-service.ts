import { mockOrders } from '@/lib/mock-orders';
import type { ServiceOrder } from '@/lib/order-types';
import { summarizeDemoPayment } from '@/lib/payment';
const KEY = 'yuesao-demo-orders-v1';
const clone = () => mockOrders.map((x) => ({ ...x }));
export const orderService = {
  load(): ServiceOrder[] {
    if (typeof window === 'undefined') return clone();
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone();
    try {
      const stored = JSON.parse(raw) as Array<
        ServiceOrder & { price?: number }
      >;
      return stored.map((item) => {
        const order = {
          ...item,
          totalAmount: item.totalAmount ?? item.price ?? 0,
          depositAmount: item.depositAmount ?? 0,
          finalPaymentDueDate: item.finalPaymentDueDate ?? null,
          payments: item.payments ?? [],
        } as ServiceOrder;
        return {
          ...order,
          paymentSummary: summarizeDemoPayment(order, '2026-09-07'),
        };
      });
    } catch {
      return clone();
    }
  },
  save(items: ServiceOrder[]) {
    localStorage.setItem(KEY, JSON.stringify(items));
  },
  reset() {
    localStorage.removeItem(KEY);
    return clone();
  },
};
