import { eq, sql } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import { hashPassword } from '../security/password.js';
import { createDatabase } from './client.js';
import {
  customers,
  roles,
  serviceOrders,
  serviceSchedules,
  serviceWorkers,
  users,
} from './schema.js';

const ids = {
  adminRole: '10000000-0000-4000-8000-000000000001',
  serviceRole: '10000000-0000-4000-8000-000000000002',
  salesRole: '10000000-0000-4000-8000-000000000003',
  dispatcherRole: '10000000-0000-4000-8000-000000000004',
  financeRole: '10000000-0000-4000-8000-000000000005',
  admin: '20000000-0000-4000-8000-000000000001',
  customerA: '30000000-0000-4000-8000-000000000001',
  customerB: '30000000-0000-4000-8000-000000000002',
  workerA: '40000000-0000-4000-8000-000000000001',
  workerB: '40000000-0000-4000-8000-000000000002',
  orderA: '50000000-0000-4000-8000-000000000001',
  orderB: '50000000-0000-4000-8000-000000000002',
  scheduleA: '60000000-0000-4000-8000-000000000001',
  scheduleB: '60000000-0000-4000-8000-000000000002',
};
const config = loadConfig();
const { db, pool } = createDatabase(config);

try {
  await db
    .insert(roles)
    .values([
      {
        id: ids.adminRole,
        slug: 'admin',
        name: '老板 / 管理员',
        isAdmin: true,
      },
      { id: ids.serviceRole, slug: 'customer_service', name: '客服' },
      { id: ids.salesRole, slug: 'sales', name: '销售' },
      { id: ids.dispatcherRole, slug: 'dispatcher', name: '派单' },
      { id: ids.financeRole, slug: 'finance', name: '财务' },
    ])
    .onConflictDoNothing();
  const passwordHash = await hashPassword(config.BOOTSTRAP_ADMIN_PASSWORD);
  await db
    .insert(users)
    .values({
      id: ids.admin,
      username: config.BOOTSTRAP_ADMIN_USERNAME,
      passwordHash,
      name: '系统管理员',
      roleId: ids.adminRole,
      status: 'active',
    })
    .onConflictDoNothing();

  if (config.APP_ENV !== 'production') {
    await db
      .insert(customers)
      .values([
        {
          id: ids.customerA,
          name: '客户 A',
          phone: '13800000001',
          city: '西安',
          serviceType: '老人陪护',
          budgetMin: 6000,
          budgetMax: 8000,
          status: '待匹配',
          dueDate: '2026-10-01',
          serviceDays: 20,
          parity: '第一胎',
          remark: '需要住家服务与老人照护。',
          family: '两位老人同住。',
          requirements: ['住家服务', '老人照护'],
          exclusions: [],
          consultant: '系统管理员',
          lastFollowUp: '刚刚',
          followUps: [{ time: '刚刚', content: 'Seed 创建客户档案。' }],
        },
        {
          id: ids.customerB,
          name: '客户 B',
          phone: '13800000002',
          city: '西安',
          serviceType: '保洁',
          budgetMin: 3000,
          budgetMax: 5000,
          status: '新客户',
          dueDate: '2026-11-01',
          serviceDays: 10,
          parity: '第一胎',
          remark: '需要长期家庭保洁。',
          family: '三口之家。',
          requirements: ['家庭保洁'],
          exclusions: [],
          consultant: '系统管理员',
          lastFollowUp: '刚刚',
          followUps: [{ time: '刚刚', content: 'Seed 创建客户档案。' }],
        },
      ])
      .onConflictDoNothing();
    const baseRatings = {
      overall: 4.8,
      newbornCare: 8.6,
      postpartumCare: 8.5,
      cooking: 8.8,
      communication: 8.7,
      boundarySense: 8.6,
      nightCare: 8.4,
    };
    await db
      .insert(serviceWorkers)
      .values([
        {
          id: ids.workerA,
          name: '服务人员 A',
          phone: '13900000001',
          age: 42,
          hometown: '陕西',
          currentCity: '西安',
          serviceLevel: '高级',
          experienceYears: 8,
          serviceCount: 36,
          serviceArea: ['西安'],
          skills: ['老人照护', '住家服务', '家庭烹饪'],
          personalityTags: ['温和', '耐心'],
          status: '已锁档',
          salaryStandard: 8000,
          rating: '4.80',
          remark: '长期住家服务经验丰富。',
          availableFrom: '2026-10-21',
          ratings: baseRatings,
        },
        {
          id: ids.workerB,
          name: '服务人员 B',
          phone: '13900000002',
          age: 39,
          hometown: '甘肃',
          currentCity: '西安',
          serviceLevel: '专业',
          experienceYears: 6,
          serviceCount: 28,
          serviceArea: ['西安', '咸阳'],
          skills: ['家庭保洁', '老人陪护'],
          personalityTags: ['细致', '稳重'],
          status: '空档',
          salaryStandard: 7000,
          rating: '4.70',
          remark: '综合家政服务经验。',
          availableFrom: '2026-10-01',
          ratings: { ...baseRatings, overall: 4.7 },
        },
      ])
      .onConflictDoNothing();
    await db
      .insert(serviceOrders)
      .values([
        {
          id: ids.orderA,
          customerId: ids.customerA,
          workerId: ids.workerA,
          serviceType: '老人陪护',
          status: 'confirmed',
          startDate: '2026-10-01',
          endDate: '2026-10-20',
          totalAmount: '7600',
          depositAmount: '2000',
          finalPaymentDueDate: '2026-10-01',
          remark: 'Seed 订单 1',
          createdBy: ids.admin,
          updatedBy: ids.admin,
        },
        {
          id: ids.orderB,
          customerId: ids.customerB,
          workerId: ids.workerB,
          serviceType: '家庭保洁',
          status: 'confirmed',
          startDate: '2026-11-01',
          endDate: '2026-11-10',
          totalAmount: '4200',
          depositAmount: '1000',
          finalPaymentDueDate: '2026-11-01',
          remark: 'Seed 订单 2',
          createdBy: ids.admin,
          updatedBy: ids.admin,
        },
      ])
      .onConflictDoNothing();
    await db
      .insert(serviceSchedules)
      .values([
        {
          id: ids.scheduleA,
          workerId: ids.workerA,
          orderId: ids.orderA,
          sourceType: 'order',
          startTime: new Date('2026-10-01T00:00:00+08:00'),
          endTime: new Date('2026-10-20T23:59:59+08:00'),
          status: 'confirmed',
          remark: 'Seed 排期 1',
          createdBy: ids.admin,
          updatedBy: ids.admin,
        },
        {
          id: ids.scheduleB,
          workerId: ids.workerB,
          orderId: ids.orderB,
          sourceType: 'order',
          startTime: new Date('2026-11-01T00:00:00+08:00'),
          endTime: new Date('2026-11-10T23:59:59+08:00'),
          status: 'confirmed',
          remark: 'Seed 排期 2',
          createdBy: ids.admin,
          updatedBy: ids.admin,
        },
      ])
      .onConflictDoNothing();
  }
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.username, config.BOOTSTRAP_ADMIN_USERNAME));
  console.log(`Seed completed. Admin users: ${count}`);
} finally {
  await pool.end();
}
