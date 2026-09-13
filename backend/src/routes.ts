import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';
import type { Database } from './db/client.js';
import {
  customers,
  payments,
  roles,
  serviceOrders,
  serviceSchedules,
  serviceWorkers,
  users,
} from './db/schema.js';
import { AppError } from './errors.js';
import { hashPassword, verifyPassword } from './security/password.js';
import type { AuthUser } from './types.js';
import {
  customerInput,
  customerUpdateInput,
  listQuery,
  loginInput,
  orderInput,
  orderListQuery,
  orderUpdateInput,
  paymentInput,
  paymentUpdateInput,
  scheduleInput,
  scheduleUpdateInput,
  userCreateInput,
  userUpdateInput,
  uuid,
  workerInput,
  workerUpdateInput,
} from './validation.js';
import { deriveAvailability, shanghaiToday } from './domain/availability.js';
import {
  calculatePaymentSummary,
  centsToNumber,
  moneyToCents,
  type PaymentSummary,
} from './domain/payment.js';

const shanghaiRangeStart = (value: string) =>
  value.length === 10 ? new Date(`${value}T00:00:00+08:00`) : new Date(value);
const shanghaiRangeEnd = (value: string) =>
  value.length === 10
    ? new Date(`${value}T23:59:59.999+08:00`)
    : new Date(value);
const isoDay = (value: Date | string | null) =>
  value
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value))
    : null;
const now = () => new Date();

type SelectDatabase = Pick<Database, 'select'>;

async function receivedAmountByOrder(
  database: SelectDatabase,
  orderIds: string[],
) {
  if (!orderIds.length) return new Map<string, string>();
  const rows = await database
    .select({
      orderId: payments.orderId,
      amount: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
    })
    .from(payments)
    .where(and(inArray(payments.orderId, orderIds), isNull(payments.deletedAt)))
    .groupBy(payments.orderId);
  return new Map(rows.map((row) => [row.orderId, row.amount]));
}

async function paymentSummaries(
  database: SelectDatabase,
  orders: Array<typeof serviceOrders.$inferSelect>,
) {
  const received = await receivedAmountByOrder(
    database,
    orders.map((order) => order.id),
  );
  const today = shanghaiToday();
  return new Map(
    orders.map((order) => [
      order.id,
      calculatePaymentSummary({
        totalAmount: order.totalAmount,
        depositAmount: order.depositAmount,
        receivedAmount: received.get(order.id) ?? '0',
        finalPaymentDueDate: order.finalPaymentDueDate,
        today,
      }),
    ]),
  );
}

function orderDto(
  order: typeof serviceOrders.$inferSelect,
  paymentSummary: PaymentSummary,
  names: { customerName?: string; workerName?: string | null } = {},
) {
  return {
    ...order,
    ...names,
    totalAmount: Number(order.totalAmount),
    depositAmount: Number(order.depositAmount),
    paymentSummary,
  };
}

function paymentDto(
  payment: typeof payments.$inferSelect,
  creatorName: string | null,
) {
  return {
    ...payment,
    amount: Number(payment.amount),
    creatorName: creatorName ?? '未知经办人',
    voided: payment.deletedAt !== null,
  };
}

function auth(request: FastifyRequest) {
  return request.user as AuthUser;
}
function assertAdmin(request: FastifyRequest) {
  const user = auth(request);
  if (!user.isAdmin) throw new AppError(403, 'FORBIDDEN', '该操作仅限管理员');
  return user;
}

function assertRole(request: FastifyRequest, allowed: string[]) {
  const user = auth(request);
  if (!user.isAdmin && !allowed.includes(user.role)) {
    throw new AppError(403, 'FORBIDDEN', '当前角色无权执行该操作');
  }
  return user;
}

function customerDto(row: typeof customers.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    serviceType: row.serviceType,
    address: row.address,
    city: row.city,
    budgetMin: row.budgetMin,
    budgetMax: row.budgetMax,
    source: row.source,
    status: row.status,
    remark: row.remark,
    originalNote: row.remark ?? '',
    dueDate: row.dueDate,
    serviceDays: row.serviceDays,
    parity: row.parity,
    family: row.family ?? '',
    requirements: row.requirements,
    exclusions: row.exclusions,
    recommendedCount: row.recommendedCount,
    consultant: row.consultant,
    lastFollowUp: row.lastFollowUp,
    followUps: row.followUps,
    demandProfile: row.demandProfile,
    recommendedNurseIds: row.recommendedWorkerIds,
    lockedNurseId: row.lockedWorkerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function workerDto(
  row: typeof serviceWorkers.$inferSelect,
  schedules: Array<Record<string, unknown>> = [],
) {
  const availability = deriveAvailability(
    schedules.map((item) => ({
      start: String(item.start),
      end: String(item.end),
      status: String(item.rawStatus),
      sourceType: item.sourceType === 'order' ? 'order' : 'manual',
    })),
  );
  const ratings = Object.keys(row.ratings).length
    ? row.ratings
    : {
        overall: Number(row.rating),
        newbornCare: 8,
        postpartumCare: 8,
        cooking: 8,
        communication: 8,
        boundarySense: 8,
        nightCare: 8,
      };
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    age: row.age,
    hometown: row.hometown,
    currentCity: row.currentCity,
    grade: row.serviceLevel,
    experienceYears: row.experienceYears,
    serviceCount: row.serviceCount,
    price26Days: row.salaryStandard,
    introduction: row.remark ?? '',
    status:
      row.status === 'disabled'
        ? '不可接单'
        : availability.inService
          ? '上户中'
          : availability.currentAvailable
            ? '空档'
            : '已锁档',
    availableFrom: availability.nextAvailableDate,
    availability,
    skillTags: row.skills,
    personalityTags: row.personalityTags,
    specialExperienceTags: row.specialExperienceTags,
    ratings: { ...ratings, overall: Number(ratings.overall ?? row.rating) },
    serviceHistory: row.serviceHistory,
    reviews: row.reviews,
    schedule: schedules,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function scheduleStatusForOrder(status: string) {
  if (status === 'in_service') return 'in_service' as const;
  if (status === 'completed') return 'completed' as const;
  if (status === 'cancelled') return 'cancelled' as const;
  if (status === 'confirmed') return 'confirmed' as const;
  return 'cancelled' as const;
}

function scheduleStatusForUi(status: string) {
  if (status === 'confirmed') return '已锁档';
  if (status === 'in_service') return '上户中';
  if (status === 'pending') return '已推荐';
  if (status === 'completed' || status === 'cancelled') return '空档';
  return status;
}

async function workerSchedules(db: Database, workerIds: string[]) {
  if (!workerIds.length)
    return new Map<string, Array<Record<string, unknown>>>();
  const rows = await db
    .select({
      schedule: serviceSchedules,
      customerId: customers.id,
      customerName: customers.name,
      city: customers.city,
    })
    .from(serviceSchedules)
    .leftJoin(serviceOrders, eq(serviceSchedules.orderId, serviceOrders.id))
    .leftJoin(customers, eq(serviceOrders.customerId, customers.id))
    .where(
      and(
        isNull(serviceSchedules.deletedAt),
        inArray(serviceSchedules.workerId, workerIds),
      ),
    )
    .orderBy(serviceSchedules.startTime);
  const map = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const list = map.get(row.schedule.workerId) ?? [];
    list.push({
      id: row.schedule.id,
      nurseId: row.schedule.workerId,
      orderId: row.schedule.orderId,
      sourceType: row.schedule.sourceType,
      start: isoDay(row.schedule.startTime),
      end: isoDay(row.schedule.endTime),
      status: scheduleStatusForUi(row.schedule.status),
      rawStatus: row.schedule.status,
      customerName: row.customerName,
      customerId: row.customerId,
      city: row.city,
      note: row.schedule.remark,
    });
    map.set(row.schedule.workerId, list);
  }
  return map;
}

async function assertNoConflict(
  db: Pick<Database, 'select'>,
  workerId: string,
  start: Date,
  end: Date,
  excludeId?: string,
) {
  const clauses = [
    eq(serviceSchedules.workerId, workerId),
    isNull(serviceSchedules.deletedAt),
    notInArray(serviceSchedules.status, ['cancelled', 'completed']),
    sql`${serviceSchedules.startTime} <= ${end}`,
    sql`${serviceSchedules.endTime} >= ${start}`,
  ];
  if (excludeId) clauses.push(ne(serviceSchedules.id, excludeId));
  const conflict = await db
    .select({ id: serviceSchedules.id })
    .from(serviceSchedules)
    .where(and(...clauses))
    .limit(1);
  if (conflict.length)
    throw new AppError(
      409,
      'SCHEDULE_CONFLICT',
      '该人员当前时间段已有服务安排。',
    );
}

async function assertActiveCustomer(db: Pick<Database, 'select'>, id: string) {
  const [item] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.id, id),
        isNull(customers.deletedAt),
        ne(customers.status, 'disabled'),
      ),
    )
    .limit(1);
  if (!item) throw new AppError(400, 'INVALID_CUSTOMER', '客户不存在或已停用');
}

async function assertActiveWorker(db: Pick<Database, 'select'>, id: string) {
  const [item] = await db
    .select({ id: serviceWorkers.id })
    .from(serviceWorkers)
    .where(
      and(
        eq(serviceWorkers.id, id),
        isNull(serviceWorkers.deletedAt),
        ne(serviceWorkers.status, 'disabled'),
      ),
    )
    .limit(1);
  if (!item)
    throw new AppError(400, 'INVALID_WORKER', '服务人员不存在或已停用');
}

const orderOccupiesSchedule = (status: string) =>
  status === 'confirmed' || status === 'in_service';

export async function registerRoutes(app: FastifyInstance, db: Database) {
  app.get('/health', async () => {
    await db.execute(sql`select 1`);
    return {
      status: 'ok',
      database: 'connected',
      time: new Date().toISOString(),
    };
  });

  app.get('/api/v1/context', { preHandler: [app.authenticate] }, async () => ({
    currentDate: shanghaiToday(),
    timeZone: 'Asia/Shanghai',
  }));

  app.post('/api/v1/auth/login', async (request, reply) => {
    const input = loginInput.parse(request.body);
    const rows = await db
      .select({ user: users, role: roles })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.username, input.username))
      .limit(1);
    const found = rows[0];
    if (
      !found ||
      found.user.status !== 'active' ||
      !(await verifyPassword(input.password, found.user.passwordHash))
    )
      throw new AppError(401, 'INVALID_CREDENTIALS', '账号或密码错误');
    const payload: AuthUser = {
      id: found.user.id,
      username: found.user.username,
      name: found.user.name,
      role: found.role.slug,
      isAdmin: found.role.isAdmin,
      tokenVersion: found.user.tokenVersion,
    };
    return reply.send({
      token: app.jwt.sign(payload, { expiresIn: '8h' }),
      user: payload,
    });
  });
  app.post(
    '/api/v1/auth/logout',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = auth(request);
      await db
        .update(users)
        .set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: now() })
        .where(eq(users.id, user.id));
      return reply.code(204).send();
    },
  );
  app.get(
    '/api/v1/auth/me',
    { preHandler: [app.authenticate] },
    async (request) => ({ user: auth(request) }),
  );

  app.get(
    '/api/v1/roles',
    { preHandler: [app.authenticate] },
    async (request) => {
      assertAdmin(request);
      return { items: await db.select().from(roles).orderBy(roles.name) };
    },
  );
  app.get(
    '/api/v1/users',
    { preHandler: [app.authenticate] },
    async (request) => {
      assertAdmin(request);
      const items = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          status: users.status,
          roleId: users.roleId,
          role: roles.slug,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .orderBy(users.name);
      return { items };
    },
  );
  app.post(
    '/api/v1/users',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertAdmin(request);
      const input = userCreateInput.parse(request.body);
      const { password, ...profile } = input;
      const [item] = await db
        .insert(users)
        .values({ ...profile, passwordHash: await hashPassword(password) })
        .returning({
          id: users.id,
          username: users.username,
          name: users.name,
          roleId: users.roleId,
          status: users.status,
        });
      return reply.code(201).send({ item, createdBy: actor.id });
    },
  );
  app.patch(
    '/api/v1/users/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      assertAdmin(request);
      const id = uuid.parse((request.params as { id: string }).id);
      const input = userUpdateInput.parse(request.body);
      const [item] = await db
        .update(users)
        .set({ ...input, updatedAt: now() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          name: users.name,
          roleId: users.roleId,
          status: users.status,
        });
      if (!item) throw new AppError(404, 'NOT_FOUND', '用户不存在');
      return { item };
    },
  );

  app.get(
    '/api/v1/customers',
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = listQuery.parse(request.query);
      const where = and(
        isNull(customers.deletedAt),
        query.status ? eq(customers.status, query.status) : undefined,
        query.q
          ? or(
              ilike(customers.name, `%${query.q}%`),
              ilike(customers.phone, `%${query.q}%`),
              ilike(customers.city, `%${query.q}%`),
            )
          : undefined,
      );
      const rows = await db
        .select()
        .from(customers)
        .where(where)
        .orderBy(desc(customers.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize);
      return {
        items: rows.map(customerDto),
        page: query.page,
        pageSize: query.pageSize,
      };
    },
  );
  app.post(
    '/api/v1/customers',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['customer_service', 'sales']);
      const input = customerInput.parse(request.body);
      const [row] = await db
        .insert(customers)
        .values({
          ...input,
          remark: input.remark ?? '',
          demandProfile: input.demandProfile ?? undefined,
          recommendedWorkerIds: input.recommendedWorkerIds ?? undefined,
          lockedWorkerId: input.lockedWorkerId ?? undefined,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning();
      return reply.code(201).send({ item: customerDto(row) });
    },
  );
  app.get(
    '/api/v1/customers/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const id = uuid.parse((request.params as { id: string }).id);
      const [row] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
        .limit(1);
      if (!row) throw new AppError(404, 'NOT_FOUND', '客户不存在');
      return { item: customerDto(row) };
    },
  );
  app.patch(
    '/api/v1/customers/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const actor = assertRole(request, ['customer_service', 'sales']);
      const id = uuid.parse((request.params as { id: string }).id);
      const input = customerUpdateInput.parse(request.body);
      const [row] = await db
        .update(customers)
        .set({
          ...input,
          remark: input.remark ?? undefined,
          demandProfile: input.demandProfile ?? undefined,
          recommendedWorkerIds: input.recommendedWorkerIds ?? undefined,
          lockedWorkerId: input.lockedWorkerId ?? undefined,
          updatedBy: actor.id,
          updatedAt: now(),
        })
        .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
        .returning();
      if (!row) throw new AppError(404, 'NOT_FOUND', '客户不存在');
      return { item: customerDto(row) };
    },
  );
  app.delete(
    '/api/v1/customers/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['customer_service', 'sales']);
      const id = uuid.parse((request.params as { id: string }).id);
      const [row] = await db
        .update(customers)
        .set({
          deletedAt: now(),
          updatedAt: now(),
          updatedBy: actor.id,
          status: 'disabled',
        })
        .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
        .returning({ id: customers.id });
      if (!row) throw new AppError(404, 'NOT_FOUND', '客户不存在');
      return reply.code(204).send();
    },
  );

  app.get(
    '/api/v1/workers',
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = listQuery.parse(request.query);
      const where = and(
        isNull(serviceWorkers.deletedAt),
        query.status ? eq(serviceWorkers.status, query.status) : undefined,
        query.q
          ? or(
              ilike(serviceWorkers.name, `%${query.q}%`),
              ilike(serviceWorkers.phone, `%${query.q}%`),
              ilike(serviceWorkers.currentCity, `%${query.q}%`),
              ilike(serviceWorkers.hometown, `%${query.q}%`),
              sql`${serviceWorkers.skills}::text ILIKE ${`%${query.q}%`}`,
            )
          : undefined,
      );
      const rows = await db
        .select()
        .from(serviceWorkers)
        .where(where)
        .orderBy(desc(serviceWorkers.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize);
      const schedules = await workerSchedules(
        db,
        rows.map((x) => x.id),
      );
      return {
        items: rows.map((row) => workerDto(row, schedules.get(row.id) ?? [])),
        page: query.page,
        pageSize: query.pageSize,
      };
    },
  );
  app.post(
    '/api/v1/workers',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['dispatcher']);
      const input = workerInput.parse(request.body);
      const [row] = await db
        .insert(serviceWorkers)
        .values({
          ...input,
          rating: String(input.rating),
          remark: input.remark ?? '',
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning();
      return reply.code(201).send({ item: workerDto(row) });
    },
  );
  app.get(
    '/api/v1/workers/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const id = uuid.parse((request.params as { id: string }).id);
      const [row] = await db
        .select()
        .from(serviceWorkers)
        .where(and(eq(serviceWorkers.id, id), isNull(serviceWorkers.deletedAt)))
        .limit(1);
      if (!row) throw new AppError(404, 'NOT_FOUND', '服务人员不存在');
      const schedules = await workerSchedules(db, [id]);
      return { item: workerDto(row, schedules.get(id) ?? []) };
    },
  );
  app.patch(
    '/api/v1/workers/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const actor = assertRole(request, ['dispatcher']);
      const id = uuid.parse((request.params as { id: string }).id);
      const input = workerUpdateInput.parse(request.body);
      const [row] = await db
        .update(serviceWorkers)
        .set({
          ...input,
          rating: input.rating === undefined ? undefined : String(input.rating),
          remark: input.remark ?? undefined,
          updatedBy: actor.id,
          updatedAt: now(),
        })
        .where(and(eq(serviceWorkers.id, id), isNull(serviceWorkers.deletedAt)))
        .returning();
      if (!row) throw new AppError(404, 'NOT_FOUND', '服务人员不存在');
      const schedules = await workerSchedules(db, [id]);
      return { item: workerDto(row, schedules.get(id) ?? []) };
    },
  );
  app.delete(
    '/api/v1/workers/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['dispatcher']);
      const id = uuid.parse((request.params as { id: string }).id);
      const [row] = await db
        .update(serviceWorkers)
        .set({
          deletedAt: now(),
          updatedAt: now(),
          updatedBy: actor.id,
          status: 'disabled',
        })
        .where(and(eq(serviceWorkers.id, id), isNull(serviceWorkers.deletedAt)))
        .returning({ id: serviceWorkers.id });
      if (!row) throw new AppError(404, 'NOT_FOUND', '服务人员不存在');
      return reply.code(204).send();
    },
  );

  app.post(
    '/api/v1/workers/:id/restore',
    { preHandler: [app.authenticate] },
    async (request) => {
      const actor = assertRole(request, ['dispatcher']);
      const id = uuid.parse((request.params as { id: string }).id);
      const [row] = await db
        .update(serviceWorkers)
        .set({
          deletedAt: null,
          status: '空档',
          updatedAt: now(),
          updatedBy: actor.id,
        })
        .where(eq(serviceWorkers.id, id))
        .returning();
      if (!row) throw new AppError(404, 'NOT_FOUND', '服务人员不存在');
      const schedules = await workerSchedules(db, [id]);
      return { item: workerDto(row, schedules.get(id) ?? []) };
    },
  );

  app.get(
    '/api/v1/orders',
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = orderListQuery.parse(request.query);
      const rows = await db
        .select({
          order: serviceOrders,
          customerName: customers.name,
          workerName: serviceWorkers.name,
        })
        .from(serviceOrders)
        .innerJoin(customers, eq(serviceOrders.customerId, customers.id))
        .leftJoin(serviceWorkers, eq(serviceOrders.workerId, serviceWorkers.id))
        .where(
          and(
            isNull(serviceOrders.deletedAt),
            query.status ? eq(serviceOrders.status, query.status) : undefined,
            query.q
              ? or(
                  ilike(customers.name, `%${query.q}%`),
                  ilike(serviceWorkers.name, `%${query.q}%`),
                  ilike(serviceOrders.serviceType, `%${query.q}%`),
                )
              : undefined,
          ),
        )
        .orderBy(desc(serviceOrders.createdAt));
      const summaries = await paymentSummaries(
        db,
        rows.map(({ order }) => order),
      );
      const filtered = query.paymentStatus
        ? rows.filter(
            ({ order }) =>
              summaries.get(order.id)?.paymentStatus === query.paymentStatus,
          )
        : rows;
      const page = filtered.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize,
      );
      return {
        items: page.map(({ order, customerName, workerName }) =>
          orderDto(order, summaries.get(order.id)!, {
            customerName,
            workerName,
          }),
        ),
        page: query.page,
        pageSize: query.pageSize,
        total: filtered.length,
      };
    },
  );
  app.post(
    '/api/v1/orders',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, [
        'customer_service',
        'sales',
        'dispatcher',
      ]);
      const input = orderInput.parse(request.body);
      const item = await db.transaction(async (tx) => {
        await assertActiveCustomer(tx, input.customerId);
        if (input.workerId) await assertActiveWorker(tx, input.workerId);
        const occupies = Boolean(
          input.workerId && orderOccupiesSchedule(input.status),
        );
        if (input.workerId && occupies)
          await assertNoConflict(
            tx,
            input.workerId,
            shanghaiRangeStart(input.startDate),
            shanghaiRangeEnd(input.endDate),
          );
        const [order] = await tx
          .insert(serviceOrders)
          .values({
            customerId: input.customerId,
            workerId: input.workerId,
            serviceType: input.serviceType,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            totalAmount: String(input.totalAmount),
            depositAmount: String(input.depositAmount),
            finalPaymentDueDate: input.finalPaymentDueDate ?? null,
            remark: input.remark ?? '',
            createdBy: actor.id,
            updatedBy: actor.id,
          })
          .returning();
        if (input.workerId && occupies)
          await tx.insert(serviceSchedules).values({
            workerId: input.workerId,
            orderId: order.id,
            sourceType: 'order',
            startTime: shanghaiRangeStart(input.startDate),
            endTime: shanghaiRangeEnd(input.endDate),
            status: input.status === 'in_service' ? 'in_service' : 'confirmed',
            remark: input.remark ?? '',
            createdBy: actor.id,
            updatedBy: actor.id,
          });
        return order;
      });
      const summaries = await paymentSummaries(db, [item]);
      return reply.code(201).send({
        item: orderDto(item, summaries.get(item.id)!),
      });
    },
  );
  app.get(
    '/api/v1/orders/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const id = uuid.parse((request.params as { id: string }).id);
      const [item] = await db
        .select()
        .from(serviceOrders)
        .where(and(eq(serviceOrders.id, id), isNull(serviceOrders.deletedAt)))
        .limit(1);
      if (!item) throw new AppError(404, 'NOT_FOUND', '订单不存在');
      const summaries = await paymentSummaries(db, [item]);
      return { item: orderDto(item, summaries.get(item.id)!) };
    },
  );
  app.patch(
    '/api/v1/orders/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const actor = assertRole(request, [
        'customer_service',
        'sales',
        'dispatcher',
      ]);
      const id = uuid.parse((request.params as { id: string }).id);
      const input = orderUpdateInput.parse(request.body);
      const item = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select id from service_orders where id = ${id} for update`,
        );
        const [existing] = await tx
          .select()
          .from(serviceOrders)
          .where(and(eq(serviceOrders.id, id), isNull(serviceOrders.deletedAt)))
          .limit(1);
        if (!existing) throw new AppError(404, 'NOT_FOUND', '订单不存在');

        if (input.totalAmount !== undefined) {
          const received = await receivedAmountByOrder(tx, [id]);
          if (
            moneyToCents(input.totalAmount) <
            moneyToCents(received.get(id) ?? '0')
          )
            throw new AppError(
              409,
              'TOTAL_BELOW_RECEIVED',
              '订单总金额不能低于已收金额，请先处理收款记录。',
            );
          const nextDeposit =
            input.depositAmount ?? Number(existing.depositAmount);
          if (nextDeposit > input.totalAmount)
            throw new AppError(
              400,
              'VALIDATION_ERROR',
              '定金金额不能超过订单总金额',
            );
        } else if (
          input.depositAmount !== undefined &&
          input.depositAmount > Number(existing.totalAmount)
        )
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            '定金金额不能超过订单总金额',
          );

        const nextWorkerId =
          input.workerId === undefined ? existing.workerId : input.workerId;
        const nextStartDate = input.startDate ?? existing.startDate;
        const nextEndDate = input.endDate ?? existing.endDate;
        const nextStatus = input.status ?? existing.status;
        if (nextEndDate < nextStartDate)
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            '结束日期不能早于开始日期',
          );
        if (input.customerId !== undefined)
          await assertActiveCustomer(tx, input.customerId);
        const [existingSchedule] = await tx
          .select()
          .from(serviceSchedules)
          .where(
            and(
              eq(serviceSchedules.orderId, id),
              isNull(serviceSchedules.deletedAt),
            ),
          )
          .limit(1);

        const occupies = Boolean(
          nextWorkerId && orderOccupiesSchedule(nextStatus),
        );
        if (nextWorkerId && occupies) {
          if (
            input.workerId !== undefined ||
            input.startDate !== undefined ||
            input.endDate !== undefined ||
            input.status !== undefined ||
            !existingSchedule
          )
            await assertActiveWorker(tx, nextWorkerId);
          const start = shanghaiRangeStart(nextStartDate);
          const end = shanghaiRangeEnd(nextEndDate);
          await assertNoConflict(
            tx,
            nextWorkerId,
            start,
            end,
            existingSchedule?.id,
          );
          if (existingSchedule) {
            await tx
              .update(serviceSchedules)
              .set({
                workerId: nextWorkerId,
                startTime: start,
                endTime: end,
                status: scheduleStatusForOrder(nextStatus),
                remark:
                  input.remark === undefined
                    ? existingSchedule.remark
                    : (input.remark ?? ''),
                updatedBy: actor.id,
                updatedAt: now(),
              })
              .where(eq(serviceSchedules.id, existingSchedule.id));
          } else {
            await tx.insert(serviceSchedules).values({
              workerId: nextWorkerId,
              orderId: id,
              sourceType: 'order',
              startTime: start,
              endTime: end,
              status: scheduleStatusForOrder(nextStatus),
              remark: input.remark ?? existing.remark ?? '',
              createdBy: actor.id,
              updatedBy: actor.id,
            });
          }
        } else if (existingSchedule) {
          await tx
            .update(serviceSchedules)
            .set({
              status: scheduleStatusForOrder(nextStatus),
              updatedAt: now(),
              updatedBy: actor.id,
            })
            .where(eq(serviceSchedules.id, existingSchedule.id));
        }

        const [updated] = await tx
          .update(serviceOrders)
          .set({
            ...input,
            totalAmount:
              input.totalAmount === undefined
                ? undefined
                : String(input.totalAmount),
            depositAmount:
              input.depositAmount === undefined
                ? undefined
                : String(input.depositAmount),
            remark: input.remark ?? undefined,
            updatedBy: actor.id,
            updatedAt: now(),
          })
          .where(eq(serviceOrders.id, id))
          .returning();
        return updated;
      });
      const summaries = await paymentSummaries(db, [item]);
      return { item: orderDto(item, summaries.get(item.id)!) };
    },
  );
  app.delete(
    '/api/v1/orders/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, [
        'customer_service',
        'sales',
        'dispatcher',
      ]);
      const id = uuid.parse((request.params as { id: string }).id);
      await db.transaction(async (tx) => {
        await tx
          .update(serviceSchedules)
          .set({
            deletedAt: now(),
            status: 'cancelled',
            updatedAt: now(),
            updatedBy: actor.id,
          })
          .where(
            and(
              eq(serviceSchedules.orderId, id),
              isNull(serviceSchedules.deletedAt),
            ),
          );
        const [item] = await tx
          .update(serviceOrders)
          .set({
            deletedAt: now(),
            status: 'cancelled',
            updatedAt: now(),
            updatedBy: actor.id,
          })
          .where(and(eq(serviceOrders.id, id), isNull(serviceOrders.deletedAt)))
          .returning({ id: serviceOrders.id });
        if (!item) throw new AppError(404, 'NOT_FOUND', '订单不存在');
      });
      return reply.code(204).send();
    },
  );

  app.get(
    '/api/v1/orders/:id/payments',
    { preHandler: [app.authenticate] },
    async (request) => {
      const orderId = uuid.parse((request.params as { id: string }).id);
      const [order] = await db
        .select()
        .from(serviceOrders)
        .where(eq(serviceOrders.id, orderId))
        .limit(1);
      if (!order) throw new AppError(404, 'NOT_FOUND', '订单不存在');
      const rows = await db
        .select({ payment: payments, creatorName: users.name })
        .from(payments)
        .leftJoin(users, eq(payments.createdBy, users.id))
        .where(eq(payments.orderId, orderId))
        .orderBy(desc(payments.paidAt), desc(payments.createdAt));
      const summaries = await paymentSummaries(db, [order]);
      return {
        items: rows.map(({ payment, creatorName }) =>
          paymentDto(payment, creatorName),
        ),
        paymentSummary: summaries.get(orderId),
      };
    },
  );

  app.post(
    '/api/v1/orders/:id/payments',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['finance']);
      const orderId = uuid.parse((request.params as { id: string }).id);
      const input = paymentInput.parse(request.body);
      const result = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select id from service_orders where id = ${orderId} for update`,
        );
        const [order] = await tx
          .select()
          .from(serviceOrders)
          .where(eq(serviceOrders.id, orderId))
          .limit(1);
        if (!order) throw new AppError(404, 'NOT_FOUND', '订单不存在');
        if (order.deletedAt || order.status === 'cancelled')
          throw new AppError(
            409,
            'ORDER_CANCELLED',
            '已取消订单不能新增收款。',
          );
        const summaries = await paymentSummaries(tx, [order]);
        const before = summaries.get(orderId)!;
        if (moneyToCents(before.outstandingAmount) === BigInt(0))
          throw new AppError(409, 'ORDER_PAID', '该订单已结清，无待收金额。');
        if (moneyToCents(input.amount) > moneyToCents(before.outstandingAmount))
          throw new AppError(
            409,
            'PAYMENT_EXCEEDS_OUTSTANDING',
            '本次收款金额超过订单待收金额。',
          );
        const [payment] = await tx
          .insert(payments)
          .values({
            orderId,
            amount: String(input.amount),
            paymentType: input.paymentType,
            paymentMethod: input.paymentMethod,
            paidAt: input.paidAt,
            remark: input.remark ?? '',
            createdBy: actor.id,
            updatedBy: actor.id,
          })
          .returning();
        const after = await paymentSummaries(tx, [order]);
        return {
          item: paymentDto(payment, actor.name),
          paymentSummary: after.get(orderId),
        };
      });
      return reply.code(201).send(result);
    },
  );

  app.patch(
    '/api/v1/payments/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const actor = assertRole(request, ['finance']);
      const id = uuid.parse((request.params as { id: string }).id);
      const input = paymentUpdateInput.parse(request.body);
      return db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(payments)
          .where(and(eq(payments.id, id), isNull(payments.deletedAt)))
          .limit(1);
        if (!existing) throw new AppError(404, 'NOT_FOUND', '收款记录不存在');
        await tx.execute(
          sql`select id from service_orders where id = ${existing.orderId} for update`,
        );
        const [order] = await tx
          .select()
          .from(serviceOrders)
          .where(eq(serviceOrders.id, existing.orderId))
          .limit(1);
        if (!order) throw new AppError(404, 'NOT_FOUND', '订单不存在');
        if (input.amount !== undefined) {
          const [{ amount }] = await tx
            .select({
              amount: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.id} <> ${id}), 0)::text`,
            })
            .from(payments)
            .where(
              and(
                eq(payments.orderId, existing.orderId),
                isNull(payments.deletedAt),
              ),
            );
          if (
            moneyToCents(amount) + moneyToCents(input.amount) >
            moneyToCents(order.totalAmount)
          )
            throw new AppError(
              409,
              'PAYMENT_EXCEEDS_OUTSTANDING',
              '本次收款金额超过订单待收金额。',
            );
        }
        const [updated] = await tx
          .update(payments)
          .set({
            ...input,
            amount:
              input.amount === undefined ? undefined : String(input.amount),
            remark: input.remark ?? undefined,
            updatedBy: actor.id,
            updatedAt: now(),
          })
          .where(eq(payments.id, id))
          .returning();
        const [creator] = await tx
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, updated.createdBy))
          .limit(1);
        const summaries = await paymentSummaries(tx, [order]);
        return {
          item: paymentDto(updated, creator?.name ?? null),
          paymentSummary: summaries.get(order.id),
        };
      });
    },
  );

  app.delete(
    '/api/v1/payments/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['finance']);
      const id = uuid.parse((request.params as { id: string }).id);
      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(payments)
          .where(and(eq(payments.id, id), isNull(payments.deletedAt)))
          .limit(1);
        if (!existing) throw new AppError(404, 'NOT_FOUND', '收款记录不存在');
        await tx.execute(
          sql`select id from service_orders where id = ${existing.orderId} for update`,
        );
        await tx
          .update(payments)
          .set({ deletedAt: now(), updatedBy: actor.id, updatedAt: now() })
          .where(eq(payments.id, id));
      });
      return reply.code(204).send();
    },
  );

  app.get(
    '/api/v1/dashboard/payments',
    { preHandler: [app.authenticate] },
    async () => {
      const orders = await db
        .select()
        .from(serviceOrders)
        .where(isNull(serviceOrders.deletedAt));
      const summaries = await paymentSummaries(db, orders);
      const today = shanghaiToday();
      const monthStart = `${today.slice(0, 7)}-01`;
      const [{ receivedThisMonth }] = await db
        .select({
          receivedThisMonth: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
        })
        .from(payments)
        .where(
          and(
            isNull(payments.deletedAt),
            gte(payments.paidAt, monthStart),
            lte(payments.paidAt, today),
          ),
        );
      const active = orders
        .filter((order) => order.status !== 'cancelled')
        .map((order) => summaries.get(order.id)!)
        .filter(Boolean);
      return {
        pendingAmount: centsToNumber(
          active.reduce(
            (sum, item) => sum + moneyToCents(item.outstandingAmount),
            BigInt(0),
          ),
        ),
        overdueCount: active.filter((item) => item.paymentStatus === 'overdue')
          .length,
        overdueAmount: centsToNumber(
          active
            .filter((item) => item.paymentStatus === 'overdue')
            .reduce(
              (sum, item) => sum + moneyToCents(item.outstandingAmount),
              BigInt(0),
            ),
        ),
        receivedThisMonth: Number(receivedThisMonth),
      };
    },
  );

  app.get(
    '/api/v1/schedules',
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = listQuery.parse(request.query);
      const rows = await db
        .select({
          schedule: serviceSchedules,
          workerName: serviceWorkers.name,
          customerName: customers.name,
        })
        .from(serviceSchedules)
        .innerJoin(
          serviceWorkers,
          eq(serviceSchedules.workerId, serviceWorkers.id),
        )
        .leftJoin(serviceOrders, eq(serviceSchedules.orderId, serviceOrders.id))
        .leftJoin(customers, eq(serviceOrders.customerId, customers.id))
        .where(
          and(
            isNull(serviceSchedules.deletedAt),
            query.status
              ? eq(serviceSchedules.status, query.status)
              : undefined,
          ),
        )
        .orderBy(serviceSchedules.startTime)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize);
      return {
        items: rows.map(({ schedule, ...names }) => ({
          ...schedule,
          ...names,
          startTime: schedule.startTime.toISOString(),
          endTime: schedule.endTime.toISOString(),
        })),
      };
    },
  );
  app.post(
    '/api/v1/schedules',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['dispatcher']);
      const input = scheduleInput.parse(request.body);
      const start = shanghaiRangeStart(input.startTime),
        end = shanghaiRangeEnd(input.endTime);
      if (end < start)
        throw new AppError(400, 'VALIDATION_ERROR', '结束时间不能早于开始时间');
      await assertActiveWorker(db, input.workerId);
      await assertNoConflict(db, input.workerId, start, end);
      const [item] = await db
        .insert(serviceSchedules)
        .values({
          ...input,
          orderId: undefined,
          sourceType: 'manual',
          startTime: start,
          endTime: end,
          remark: input.remark ?? '',
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning();
      return reply.code(201).send({ item });
    },
  );
  app.patch(
    '/api/v1/schedules/:id',
    { preHandler: [app.authenticate] },
    async (request) => {
      const actor = assertRole(request, ['dispatcher']);
      const id = uuid.parse((request.params as { id: string }).id);
      const input = scheduleUpdateInput.parse(request.body);
      const [existing] = await db
        .select()
        .from(serviceSchedules)
        .where(
          and(eq(serviceSchedules.id, id), isNull(serviceSchedules.deletedAt)),
        )
        .limit(1);
      if (!existing) throw new AppError(404, 'NOT_FOUND', '排期不存在');
      const workerId = input.workerId ?? existing.workerId,
        start = input.startTime
          ? shanghaiRangeStart(input.startTime)
          : existing.startTime,
        end = input.endTime
          ? shanghaiRangeEnd(input.endTime)
          : existing.endTime;
      if (end < start)
        throw new AppError(400, 'VALIDATION_ERROR', '结束时间不能早于开始时间');
      const nextStatus = input.status ?? existing.status;
      if (nextStatus !== 'cancelled' && nextStatus !== 'completed') {
        if (input.workerId !== undefined)
          await assertActiveWorker(db, workerId);
        await assertNoConflict(db, workerId, start, end, id);
      }
      const [item] = await db
        .update(serviceSchedules)
        .set({
          ...input,
          startTime: start,
          endTime: end,
          remark: input.remark ?? undefined,
          updatedBy: actor.id,
          updatedAt: now(),
        })
        .where(eq(serviceSchedules.id, id))
        .returning();
      return { item };
    },
  );
  app.delete(
    '/api/v1/schedules/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const actor = assertRole(request, ['dispatcher']);
      const id = uuid.parse((request.params as { id: string }).id);
      const [item] = await db
        .update(serviceSchedules)
        .set({
          deletedAt: now(),
          status: 'cancelled',
          updatedAt: now(),
          updatedBy: actor.id,
        })
        .where(
          and(eq(serviceSchedules.id, id), isNull(serviceSchedules.deletedAt)),
        )
        .returning({ id: serviceSchedules.id });
      if (!item) throw new AppError(404, 'NOT_FOUND', '排期不存在');
      return reply.code(204).send();
    },
  );
}
