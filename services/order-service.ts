import { mockOrders } from '@/lib/mock-orders';
import type { ServiceOrder } from '@/lib/order-types';
const KEY = 'yuesao-demo-orders-v1';
const clone = () => mockOrders.map((x) => ({ ...x }));
export const orderService = {
  load(): ServiceOrder[] {
    if (typeof window === 'undefined') return clone();
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone();
    try {
      return JSON.parse(raw) as ServiceOrder[];
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
