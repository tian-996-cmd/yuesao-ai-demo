import type { MaternityNurse, NurseFormInput } from '@/lib/nurse-types';
import type {
  NewOrderInput,
  NewPaymentInput,
  PaymentRecord,
  PaymentSummary,
  ServiceOrder,
} from '@/lib/order-types';
import type { Customer, DemandProfile, NewCustomerInput } from '@/lib/types';
import { apiRequest, tokenStore } from './api-client';

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: string;
  isAdmin: boolean;
};
const json = (value: unknown) => JSON.stringify(value);

async function fetchAll<T>(path: string) {
  const items: T[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const result = await apiRequest<{ items: T[] }>(
      `${path}${separator}page=${page}&pageSize=100`,
    );
    items.push(...result.items);
    if (result.items.length < 100) break;
  }
  return items;
}

function customerPayload(input: NewCustomerInput | Customer) {
  const current = input as Partial<Customer>;
  return {
    name: input.name,
    phone: input.phone,
    serviceType: '月嫂',
    city: input.city,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    source: '线下咨询',
    status: current.status ?? '新客户',
    remark: input.originalNote,
    dueDate: input.dueDate,
    serviceDays: input.serviceDays,
    parity: input.parity,
    family: current.family ?? '待补充家庭情况。',
    requirements: current.requirements ?? [],
    exclusions: current.exclusions ?? [],
    recommendedCount: current.recommendedCount ?? 0,
    consultant: current.consultant ?? '系统管理员',
    lastFollowUp: current.lastFollowUp ?? '刚刚',
    followUps: current.followUps ?? [
      { time: '刚刚', content: '新建客户档案。' },
    ],
    demandProfile: current.demandProfile as DemandProfile | undefined,
    recommendedWorkerIds: current.recommendedNurseIds,
    lockedWorkerId: current.lockedNurseId,
  };
}
function workerPayload(input: NurseFormInput | MaternityNurse) {
  const current = input as Partial<MaternityNurse>;
  return {
    name: input.name,
    phone: input.phone,
    age: input.age,
    hometown: input.hometown,
    currentCity: input.currentCity,
    serviceLevel: current.grade ?? '专业',
    experienceYears: input.experienceYears,
    serviceCount: input.serviceCount,
    serviceArea: [input.currentCity],
    skills: input.skillTags,
    personalityTags: input.personalityTags,
    specialExperienceTags: current.specialExperienceTags ?? [],
    status: current.status ?? '空档',
    salaryStandard: input.price26Days,
    rating: current.ratings?.overall ?? 4.8,
    remark: input.introduction,
    availableFrom: input.availableFrom,
    ratings: current.ratings ?? {},
    serviceHistory: (current.serviceHistory ?? []) as unknown as Array<
      Record<string, unknown>
    >,
    reviews: (current.reviews ?? []) as unknown as Array<
      Record<string, unknown>
    >,
  };
}

export const productionApi = {
  async login(username: string, password: string) {
    const result = await apiRequest<{ token: string; user: SessionUser }>(
      '/auth/login',
      { method: 'POST', body: json({ username, password }) },
    );
    tokenStore.set(result.token);
    return result.user;
  },
  async me() {
    return (await apiRequest<{ user: SessionUser }>('/auth/me')).user;
  },
  async logout() {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' });
    } finally {
      tokenStore.clear();
    }
  },
  async bootstrap() {
    const [customers, workers, orders, context, paymentMetrics] =
      await Promise.all([
        fetchAll<Customer>('/customers'),
        fetchAll<MaternityNurse>('/workers'),
        fetchAll<ServiceOrder>('/orders'),
        apiRequest<{ currentDate: string; timeZone: string }>('/context'),
        apiRequest<{
          pendingAmount: number;
          overdueCount: number;
          overdueAmount: number;
          receivedThisMonth: number;
        }>('/dashboard/payments'),
      ]);
    return { customers, nurses: workers, orders, context, paymentMetrics };
  },
  async createCustomer(input: NewCustomerInput) {
    return (
      await apiRequest<{ item: Customer }>('/customers', {
        method: 'POST',
        body: json(customerPayload(input)),
      })
    ).item;
  },
  async updateCustomer(item: Customer) {
    return (
      await apiRequest<{ item: Customer }>(`/customers/${item.id}`, {
        method: 'PATCH',
        body: json(customerPayload(item)),
      })
    ).item;
  },
  async deleteCustomer(id: string) {
    await apiRequest<void>(`/customers/${id}`, { method: 'DELETE' });
  },
  async createWorker(input: NurseFormInput) {
    return (
      await apiRequest<{ item: MaternityNurse }>('/workers', {
        method: 'POST',
        body: json(workerPayload(input)),
      })
    ).item;
  },
  async updateWorker(item: MaternityNurse) {
    return (
      await apiRequest<{ item: MaternityNurse }>(`/workers/${item.id}`, {
        method: 'PATCH',
        body: json(workerPayload(item)),
      })
    ).item;
  },
  async deleteWorker(id: string) {
    await apiRequest<void>(`/workers/${id}`, { method: 'DELETE' });
  },
  async createOrder(input: NewOrderInput) {
    return (
      await apiRequest<{ item: ServiceOrder }>('/orders', {
        method: 'POST',
        body: json({ ...input, createSchedule: input.createSchedule ?? true }),
      })
    ).item;
  },
  async updateOrder(id: string, input: NewOrderInput) {
    return (
      await apiRequest<{ item: ServiceOrder }>(`/orders/${id}`, {
        method: 'PATCH',
        body: json(input),
      })
    ).item;
  },
  async createSchedule(input: {
    workerId: string;
    startTime: string;
    endTime: string;
    status?: string;
    remark?: string;
  }) {
    return (
      await apiRequest<{ item: unknown }>('/schedules', {
        method: 'POST',
        body: json(input),
      })
    ).item;
  },
  async listPayments(orderId: string) {
    return apiRequest<{
      items: PaymentRecord[];
      paymentSummary: PaymentSummary;
    }>(`/orders/${orderId}/payments`);
  },
  async createPayment(orderId: string, input: NewPaymentInput) {
    return apiRequest<{
      item: PaymentRecord;
      paymentSummary: PaymentSummary;
    }>(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: json(input),
    });
  },
  async voidPayment(paymentId: string) {
    await apiRequest<void>(`/payments/${paymentId}`, { method: 'DELETE' });
  },
  async paymentDashboard() {
    return apiRequest<{
      pendingAmount: number;
      overdueCount: number;
      overdueAmount: number;
      receivedThisMonth: number;
    }>('/dashboard/payments');
  },
};
