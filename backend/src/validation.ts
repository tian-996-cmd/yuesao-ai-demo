import { z } from 'zod';

export const uuid = z.uuid();
export const dateText = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD');
export const dateTimeText = z.iso.datetime({ offset: true });

export const loginInput = z.object({
  username: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(200),
});

export const userCreateInput = z.object({
  username: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(80),
  roleId: uuid,
});
export const userUpdateInput = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  roleId: uuid.optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

export const customerInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(5).max(40),
    serviceType: z.string().trim().min(1).max(60).default('月嫂'),
    address: z.string().max(500).optional().nullable(),
    city: z.string().trim().min(1).max(100),
    budgetMin: z.number().int().min(0),
    budgetMax: z.number().int().min(0),
    source: z.string().max(60).default('线下咨询'),
    status: z.string().max(30).default('新客户'),
    remark: z.string().max(5000).optional().nullable(),
    dueDate: dateText,
    serviceDays: z.number().int().min(1).max(365).default(26),
    parity: z.string().max(20).default('第一胎'),
    family: z.string().max(2000).optional().nullable(),
    requirements: z.array(z.string().max(100)).default([]),
    exclusions: z.array(z.string().max(100)).default([]),
    recommendedCount: z.number().int().min(0).default(0),
    consultant: z.string().max(80).default('未分配'),
    lastFollowUp: z.string().max(80).default('暂无'),
    followUps: z
      .array(
        z.object({ time: z.string().max(80), content: z.string().max(2000) }),
      )
      .default([]),
    demandProfile: z.record(z.string(), z.unknown()).optional().nullable(),
    recommendedWorkerIds: z.array(uuid).optional().nullable(),
    lockedWorkerId: uuid.optional().nullable(),
  })
  .refine((value) => value.budgetMax >= value.budgetMin, {
    path: ['budgetMax'],
    message: '预算上限不能低于预算下限',
  });
export const customerUpdateInput = customerInput.partial();

export const workerInput = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(40),
  age: z.number().int().min(18).max(80).default(40),
  hometown: z.string().max(100).default(''),
  currentCity: z.string().max(100).default(''),
  serviceLevel: z.string().max(40).default('专业'),
  experienceYears: z.number().int().min(0).max(60).default(0),
  serviceCount: z.number().int().min(0).default(0),
  serviceArea: z.array(z.string().max(100)).default([]),
  skills: z.array(z.string().max(100)).default([]),
  personalityTags: z.array(z.string().max(100)).default([]),
  specialExperienceTags: z.array(z.string().max(100)).default([]),
  status: z.string().max(30).default('空档'),
  salaryStandard: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).default(5),
  remark: z.string().max(5000).optional().nullable(),
  availableFrom: dateText,
  ratings: z.record(z.string(), z.number()).default({}),
  serviceHistory: z.array(z.record(z.string(), z.unknown())).default([]),
  reviews: z.array(z.record(z.string(), z.unknown())).default([]),
});
export const workerUpdateInput = workerInput.partial();

export const orderStatus = z.enum([
  'pending',
  'confirmed',
  'in_service',
  'completed',
  'cancelled',
]);
export const orderInput = z
  .object({
    customerId: uuid,
    workerId: uuid.optional().nullable(),
    serviceType: z.string().trim().min(1).max(60),
    status: orderStatus.default('pending'),
    startDate: dateText,
    endDate: dateText,
    price: z.number().min(0),
    remark: z.string().max(5000).optional().nullable(),
    createSchedule: z.boolean().default(true),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ['endDate'],
    message: '结束日期不能早于开始日期',
  });
export const orderUpdateInput = orderInput
  .omit({ createSchedule: true })
  .partial();

export const scheduleStatus = z.enum([
  'pending',
  'confirmed',
  'in_service',
  'completed',
  'cancelled',
  '休息',
  '不可接单',
]);
export const scheduleInput = z.object({
  workerId: uuid,
  orderId: uuid.optional().nullable(),
  startTime: z.union([dateText, dateTimeText]),
  endTime: z.union([dateText, dateTimeText]),
  status: scheduleStatus.default('confirmed'),
  remark: z.string().max(5000).optional().nullable(),
});
export const scheduleUpdateInput = scheduleInput.partial();

export const listQuery = z.object({
  q: z.string().max(100).optional(),
  status: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
