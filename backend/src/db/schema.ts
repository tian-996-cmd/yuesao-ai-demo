import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

const auditColumns = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 40 }).notNull(),
    name: varchar('name', { length: 40 }).notNull(),
    description: text('description'),
    isAdmin: boolean('is_admin').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('roles_slug_unique').on(table.slug)],
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 80 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    tokenVersion: integer('token_version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('users_username_unique').on(table.username),
    index('users_role_idx').on(table.roleId),
  ],
);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 40 }).notNull(),
    serviceType: varchar('service_type', { length: 60 })
      .notNull()
      .default('月嫂'),
    address: text('address'),
    city: varchar('city', { length: 100 }).notNull(),
    budgetMin: integer('budget_min').notNull().default(0),
    budgetMax: integer('budget_max').notNull().default(0),
    source: varchar('source', { length: 60 }).notNull().default('线下咨询'),
    status: varchar('status', { length: 30 }).notNull().default('新客户'),
    remark: text('remark'),
    dueDate: date('due_date'),
    serviceDays: integer('service_days').notNull().default(26),
    parity: varchar('parity', { length: 20 }).notNull().default('第一胎'),
    family: text('family'),
    requirements: jsonb('requirements').$type<string[]>().notNull().default([]),
    exclusions: jsonb('exclusions').$type<string[]>().notNull().default([]),
    recommendedCount: integer('recommended_count').notNull().default(0),
    consultant: varchar('consultant', { length: 80 })
      .notNull()
      .default('未分配'),
    lastFollowUp: varchar('last_follow_up', { length: 80 })
      .notNull()
      .default('暂无'),
    followUps: jsonb('follow_ups')
      .$type<Array<{ time: string; content: string }>>()
      .notNull()
      .default([]),
    demandProfile: jsonb('demand_profile').$type<Record<string, unknown>>(),
    recommendedWorkerIds: jsonb('recommended_worker_ids').$type<string[]>(),
    lockedWorkerId: uuid('locked_worker_id').references(
      (): AnyPgColumn => serviceWorkers.id,
      { onDelete: 'restrict' },
    ),
    ...auditColumns,
  },
  (table) => [
    index('customers_status_idx').on(table.status),
    index('customers_name_idx').on(table.name),
    check(
      'customers_budget_range_check',
      sql`${table.budgetMax} >= ${table.budgetMin}`,
    ),
  ],
);

export const serviceWorkers = pgTable(
  'service_workers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 40 }).notNull(),
    age: integer('age').notNull().default(40),
    hometown: varchar('hometown', { length: 100 }).notNull().default(''),
    currentCity: varchar('current_city', { length: 100 }).notNull().default(''),
    serviceLevel: varchar('service_level', { length: 40 })
      .notNull()
      .default('专业'),
    experienceYears: integer('experience_years').notNull().default(0),
    serviceCount: integer('service_count').notNull().default(0),
    serviceArea: jsonb('service_area').$type<string[]>().notNull().default([]),
    skills: jsonb('skills').$type<string[]>().notNull().default([]),
    personalityTags: jsonb('personality_tags')
      .$type<string[]>()
      .notNull()
      .default([]),
    specialExperienceTags: jsonb('special_experience_tags')
      .$type<string[]>()
      .notNull()
      .default([]),
    status: varchar('status', { length: 30 }).notNull().default('空档'),
    salaryStandard: integer('salary_standard').notNull().default(0),
    rating: numeric('rating', { precision: 3, scale: 2 })
      .notNull()
      .default('5.00'),
    remark: text('remark'),
    availableFrom: date('available_from').notNull(),
    ratings: jsonb('ratings')
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    serviceHistory: jsonb('service_history')
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    reviews: jsonb('reviews')
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    ...auditColumns,
  },
  (table) => [
    index('workers_status_idx').on(table.status),
    index('workers_name_idx').on(table.name),
  ],
);

export const serviceOrders = pgTable(
  'service_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    workerId: uuid('worker_id').references(() => serviceWorkers.id, {
      onDelete: 'restrict',
    }),
    serviceType: varchar('service_type', { length: 60 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    depositAmount: numeric('deposit_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    finalPaymentDueDate: date('final_payment_due_date'),
    remark: text('remark'),
    ...auditColumns,
  },
  (table) => [
    index('orders_customer_idx').on(table.customerId),
    index('orders_worker_idx').on(table.workerId),
    index('orders_status_idx').on(table.status),
    check(
      'orders_date_range_check',
      sql`${table.endDate} >= ${table.startDate}`,
    ),
    check(
      'orders_deposit_amount_check',
      sql`${table.depositAmount} >= 0 AND ${table.depositAmount} <= ${table.totalAmount}`,
    ),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => serviceOrders.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentType: varchar('payment_type', { length: 20 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 30 }).notNull(),
    paidAt: date('paid_at').notNull(),
    remark: text('remark'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    updatedBy: uuid('updated_by').references(() => users.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('payments_order_idx').on(table.orderId),
    index('payments_paid_at_idx').on(table.paidAt),
    check('payments_amount_positive_check', sql`${table.amount} > 0`),
    check(
      'payments_type_check',
      sql`${table.paymentType} IN ('deposit', 'final', 'partial', 'other', 'refund')`,
    ),
    check(
      'payments_method_check',
      sql`${table.paymentMethod} IN ('cash', 'wechat', 'alipay', 'bank_transfer', 'other')`,
    ),
  ],
);

export const serviceSchedules = pgTable(
  'service_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workerId: uuid('worker_id')
      .notNull()
      .references(() => serviceWorkers.id, { onDelete: 'restrict' }),
    orderId: uuid('order_id').references(() => serviceOrders.id, {
      onDelete: 'restrict',
    }),
    sourceType: varchar('source_type', { length: 20 })
      .notNull()
      .default('manual'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('confirmed'),
    remark: text('remark'),
    ...auditColumns,
  },
  (table) => [
    index('schedules_worker_time_idx').on(
      table.workerId,
      table.startTime,
      table.endTime,
    ),
    index('schedules_order_idx').on(table.orderId),
    uniqueIndex('schedules_active_order_unique')
      .on(table.orderId)
      .where(sql`${table.deletedAt} IS NULL AND ${table.orderId} IS NOT NULL`),
    check(
      'schedules_time_range_check',
      sql`${table.endTime} >= ${table.startTime}`,
    ),
    check(
      'schedules_source_type_check',
      sql`${table.sourceType} IN ('order', 'manual')`,
    ),
    check(
      'schedules_source_relation_check',
      sql`(${table.sourceType} = 'order' AND ${table.orderId} IS NOT NULL) OR (${table.sourceType} = 'manual' AND ${table.orderId} IS NULL)`,
    ),
  ],
);

export const roleRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));
export const userRelations = relations(users, ({ one }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
}));
export const customerRelations = relations(customers, ({ many }) => ({
  orders: many(serviceOrders),
}));
export const workerRelations = relations(serviceWorkers, ({ many }) => ({
  orders: many(serviceOrders),
  schedules: many(serviceSchedules),
}));
export const orderRelations = relations(serviceOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [serviceOrders.customerId],
    references: [customers.id],
  }),
  worker: one(serviceWorkers, {
    fields: [serviceOrders.workerId],
    references: [serviceWorkers.id],
  }),
  schedules: many(serviceSchedules),
  payments: many(payments),
}));
export const paymentRelations = relations(payments, ({ one }) => ({
  order: one(serviceOrders, {
    fields: [payments.orderId],
    references: [serviceOrders.id],
  }),
  creator: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));
export const scheduleRelations = relations(serviceSchedules, ({ one }) => ({
  worker: one(serviceWorkers, {
    fields: [serviceSchedules.workerId],
    references: [serviceWorkers.id],
  }),
  order: one(serviceOrders, {
    fields: [serviceSchedules.orderId],
    references: [serviceOrders.id],
  }),
}));
