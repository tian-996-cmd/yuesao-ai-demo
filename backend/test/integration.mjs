import assert from 'node:assert/strict';
import pg from 'pg';

const base = 'http://127.0.0.1:3001/api/v1';
const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required for PostgreSQL integration tests');

async function queryDb(text, values = []) {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await client.query(text, values);
  } finally {
    await client.end();
  }
}

async function request(path, { token, ...init } = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = response.status === 204 ? null : await response.json();
  return { status: response.status, body };
}
async function waitForApi() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:3001/health');
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('API did not become healthy');
}

await waitForApi();
const schemaState = await queryDb(`
  select
    exists(select 1 from pg_extension where extname = 'btree_gist') as has_btree_gist,
    (select array_agg(tablename order by tablename)
      from pg_tables
      where schemaname = 'public'
        and tablename in ('roles', 'users', 'customers', 'service_workers', 'service_orders', 'service_schedules')) as tables,
    exists(select 1 from pg_constraint where conname = 'service_schedules_no_overlap') as has_exclusion
`);
assert.equal(schemaState.rows[0].has_btree_gist, true);
assert.deepEqual(schemaState.rows[0].tables, [
  'customers',
  'roles',
  'service_orders',
  'service_schedules',
  'service_workers',
  'users',
]);
assert.equal(schemaState.rows[0].has_exclusion, true);

const seeded = await queryDb(`
  select
    (select count(*)::int from roles where slug in ('admin', 'customer_service', 'sales', 'dispatcher', 'finance')) as role_count,
    (select count(*)::int from users where username = $1) as admin_count,
    (select count(*)::int from customers where id in ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002')) as customer_count,
    (select count(*)::int from service_workers where id in ('40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002')) as worker_count,
    (select count(*)::int from service_orders where id in ('50000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002')) as order_count,
    (select count(*)::int from service_schedules where id in ('60000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002')) as schedule_count
`, [process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin']);
assert.deepEqual(seeded.rows[0], {
  role_count: 5,
  admin_count: 1,
  customer_count: 2,
  worker_count: 2,
  order_count: 2,
  schedule_count: 2,
});

for (const path of ['/customers', '/workers', '/orders', '/schedules']) {
  const unauthorized = await request(path);
  assert.equal(unauthorized.status, 401, `${path} must require authentication`);
}
const wrongPassword = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin',
    password: 'definitely-wrong-password',
  }),
});
assert.equal(wrongPassword.status, 401);
const login = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'demo2026',
  }),
});
assert.equal(login.status, 200);
const token = login.body.token;
for (const path of ['/customers', '/workers', '/orders', '/schedules']) {
  const authorized = await request(path, { token });
  assert.equal(authorized.status, 200, `${path} must accept a valid token`);
}
const roles = await request('/roles', { token });
assert.equal(roles.status, 200);
const salesRole = roles.body.items.find((item) => item.slug === 'sales');
assert.ok(salesRole);
const salesName = `sales-${Date.now()}`;
const createUser = await request('/users', {
  token,
  method: 'POST',
  body: JSON.stringify({
    username: salesName,
    password: 'sales-pass-2026',
    name: '测试销售',
    roleId: salesRole.id,
  }),
});
assert.equal(createUser.status, 201);
const salesLogin = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username: salesName, password: 'sales-pass-2026' }),
});
assert.equal(salesLogin.status, 200);
const forbidden = await request('/roles', { token: salesLogin.body.token });
assert.equal(forbidden.status, 403);
const forbiddenWorkerWrite = await request('/workers', {
  token: salesLogin.body.token,
  method: 'POST',
  body: JSON.stringify({}),
});
assert.equal(forbiddenWorkerWrite.status, 403);

const stamp = Date.now();
const customerPayload = (name) => ({
  name,
  phone: '13800000000',
  serviceType: '老人陪护',
  city: '西安',
  budgetMin: 6000,
  budgetMax: 8000,
  source: '集成测试',
  status: '新客户',
  remark: '集成测试客户',
  dueDate: '2027-10-01',
  serviceDays: 20,
  parity: '第一胎',
  family: '测试家庭',
  requirements: ['老人照护'],
  exclusions: [],
  recommendedCount: 0,
  consultant: '系统管理员',
  lastFollowUp: '刚刚',
  followUps: [],
});
const customerA = await request('/customers', {
  token,
  method: 'POST',
  body: JSON.stringify(customerPayload(`客户A-${stamp}`)),
});
const customerB = await request('/customers', {
  token,
  method: 'POST',
  body: JSON.stringify(customerPayload(`客户B-${stamp}`)),
});
assert.equal(customerA.status, 201);
assert.equal(customerB.status, 201);
assert.notEqual(customerA.body.item.id, customerB.body.item.id);
const bothCustomers = await request(`/customers?q=${stamp}`, { token });
assert.equal(bothCustomers.status, 200);
assert.equal(bothCustomers.body.items.length, 2);
const updatedCustomerA = await request(`/customers/${customerA.body.item.id}`, {
  token,
  method: 'PATCH',
  body: JSON.stringify({ remark: '只修改客户 A' }),
});
assert.equal(updatedCustomerA.status, 200);
assert.equal(updatedCustomerA.body.item.remark, '只修改客户 A');
const untouchedCustomerB = await request(`/customers/${customerB.body.item.id}`, {
  token,
});
assert.equal(untouchedCustomerB.status, 200);
assert.equal(untouchedCustomerB.body.item.remark, '集成测试客户');
const workerPayload = (name) => ({
  name,
  phone: '13900000000',
  age: 40,
  hometown: '陕西',
  currentCity: '西安',
  serviceLevel: '高级',
  experienceYears: 8,
  serviceCount: 20,
  serviceArea: ['西安'],
  skills: ['老人照护'],
  personalityTags: ['耐心'],
  specialExperienceTags: [],
  status: '空档',
  salaryStandard: 8000,
  rating: 4.8,
  remark: '集成测试人员',
  availableFrom: '2027-10-01',
  ratings: { overall: 4.8 },
  serviceHistory: [],
  reviews: [],
});
const workerA = await request('/workers', {
  token,
  method: 'POST',
  body: JSON.stringify(workerPayload(`人员A-${stamp}`)),
});
const workerB = await request('/workers', {
  token,
  method: 'POST',
  body: JSON.stringify(workerPayload(`人员B-${stamp}`)),
});
assert.equal(workerA.status, 201);
assert.equal(workerB.status, 201);
assert.notEqual(workerA.body.item.id, workerB.body.item.id);
const updatedWorkerA = await request(`/workers/${workerA.body.item.id}`, {
  token,
  method: 'PATCH',
  body: JSON.stringify({ remark: '只修改人员 A' }),
});
assert.equal(updatedWorkerA.status, 200);
assert.equal(updatedWorkerA.body.item.introduction, '只修改人员 A');
const untouchedWorkerB = await request(`/workers/${workerB.body.item.id}`, {
  token,
});
assert.equal(untouchedWorkerB.status, 200);
assert.equal(untouchedWorkerB.body.item.introduction, '集成测试人员');
const orderPayload = {
  customerId: customerA.body.item.id,
  workerId: workerA.body.item.id,
  serviceType: '老人陪护',
  status: 'confirmed',
  startDate: '2026-10-01',
  endDate: '2026-10-20',
  price: 7600,
  remark: '集成测试订单',
  createSchedule: true,
};
const order1 = await request('/orders', {
  token,
  method: 'POST',
  body: JSON.stringify(orderPayload),
});
const order2 = await request('/orders', {
  token,
  method: 'POST',
  body: JSON.stringify({
    ...orderPayload,
    customerId: customerB.body.item.id,
    workerId: workerB.body.item.id,
    startDate: '2026-12-01',
    endDate: '2026-12-20',
    createSchedule: false,
  }),
});
assert.equal(order1.status, 201);
assert.equal(order2.status, 201);
assert.notEqual(order1.body.item.id, order2.body.item.id);
assert.equal(order1.body.item.customerId, customerA.body.item.id);
assert.equal(order1.body.item.workerId, workerA.body.item.id);
assert.equal(order2.body.item.customerId, customerB.body.item.id);
assert.equal(order2.body.item.workerId, workerB.body.item.id);
const updatedOrder1 = await request(`/orders/${order1.body.item.id}`, {
  token,
  method: 'PATCH',
  body: JSON.stringify({ remark: '只修改订单 1', price: 7800 }),
});
assert.equal(updatedOrder1.status, 200);
assert.equal(updatedOrder1.body.item.remark, '只修改订单 1');
assert.equal(updatedOrder1.body.item.price, 7800);
const untouchedOrder2 = await request(`/orders/${order2.body.item.id}`, {
  token,
});
assert.equal(untouchedOrder2.status, 200);
assert.equal(untouchedOrder2.body.item.price, 7600);
assert.equal(untouchedOrder2.body.item.remark, '集成测试订单');
const conflict = await request('/schedules', {
  token,
  method: 'POST',
  body: JSON.stringify({
    workerId: workerA.body.item.id,
    startTime: '2026-10-10',
    endTime: '2026-10-30',
    status: 'confirmed',
  }),
});
assert.equal(conflict.status, 409);
assert.equal(conflict.body.error.code, 'SCHEDULE_CONFLICT');
assert.equal(conflict.body.error.message, '该人员当前时间段已有服务安排。');
const alternate = await request('/schedules', {
  token,
  method: 'POST',
  body: JSON.stringify({
    workerId: workerB.body.item.id,
    startTime: '2026-10-10',
    endTime: '2026-10-30',
    status: 'confirmed',
  }),
});
assert.equal(alternate.status, 201);
const nonOverlapping = await request('/schedules', {
  token,
  method: 'POST',
  body: JSON.stringify({
    workerId: workerA.body.item.id,
    startTime: '2026-10-21',
    endTime: '2026-10-30',
    status: 'confirmed',
  }),
});
assert.equal(nonOverlapping.status, 201);

let directConflict;
try {
  await queryDb(
    `insert into service_schedules (worker_id, start_time, end_time, status, remark)
     values ($1, $2, $3, 'confirmed', 'direct database overlap test')`,
    [workerA.body.item.id, '2026-10-05T00:00:00+08:00', '2026-10-08T00:00:00+08:00'],
  );
} catch (error) {
  directConflict = error;
}
assert.equal(directConflict?.code, '23P01');

const concurrentSql = `insert into service_schedules
  (worker_id, start_time, end_time, status, remark)
  values ($1, '2027-02-01T00:00:00+08:00', '2027-02-10T00:00:00+08:00', 'confirmed', 'concurrent exclusion test')
  returning id`;
const concurrentResults = await Promise.allSettled([
  queryDb(concurrentSql, [workerB.body.item.id]),
  queryDb(concurrentSql, [workerB.body.item.id]),
]);
assert.equal(
  concurrentResults.filter((result) => result.status === 'fulfilled').length,
  1,
);
const rejectedConcurrent = concurrentResults.find(
  (result) => result.status === 'rejected',
);
assert.equal(rejectedConcurrent?.reason?.code, '23P01');
await queryDb(
  "delete from service_schedules where remark = 'concurrent exclusion test'",
);

const assignOrder = await request(`/orders/${order2.body.item.id}`, {
  token,
  method: 'PATCH',
  body: JSON.stringify({ workerId: workerB.body.item.id }),
});
assert.equal(assignOrder.status, 200);
const schedules = await request('/schedules', { token });
const linkedSchedule = schedules.body.items.find(
  (item) => item.orderId === order2.body.item.id,
);
assert.ok(linkedSchedule);
assert.equal(linkedSchedule.workerId, workerB.body.item.id);

const conflictingOrderEdit = await request(`/orders/${order1.body.item.id}`, {
  token,
  method: 'PATCH',
  body: JSON.stringify({
    workerId: workerB.body.item.id,
    startDate: '2026-10-15',
    endDate: '2026-10-25',
  }),
});
assert.equal(conflictingOrderEdit.status, 409);
assert.equal(conflictingOrderEdit.body.error.code, 'SCHEDULE_CONFLICT');

const deletedCustomerA = await request(`/customers/${customerA.body.item.id}`, {
  token,
  method: 'DELETE',
});
assert.equal(deletedCustomerA.status, 204);
const customerAAfterDelete = await request(
  `/customers?q=${encodeURIComponent(`客户A-${stamp}`)}`,
  { token },
);
assert.equal(customerAAfterDelete.body.items.length, 0);
const customerBAfterDelete = await request(`/customers/${customerB.body.item.id}`, {
  token,
});
assert.equal(customerBAfterDelete.status, 200);
const customerRows = await queryDb(
  'select id, deleted_at from customers where id = any($1::uuid[]) order by id',
  [[customerA.body.item.id, customerB.body.item.id]],
);
assert.equal(customerRows.rows.length, 2);
assert.ok(customerRows.rows.find((row) => row.id === customerA.body.item.id)?.deleted_at);
assert.equal(
  customerRows.rows.find((row) => row.id === customerB.body.item.id)?.deleted_at,
  null,
);

const deletedWorkerA = await request(`/workers/${workerA.body.item.id}`, {
  token,
  method: 'DELETE',
});
assert.equal(deletedWorkerA.status, 204);
const workerAAfterDelete = await request(
  `/workers?q=${encodeURIComponent(`人员A-${stamp}`)}`,
  { token },
);
assert.equal(workerAAfterDelete.body.items.length, 0);
const workerBAfterDelete = await request(`/workers/${workerB.body.item.id}`, {
  token,
});
assert.equal(workerBAfterDelete.status, 200);
const workerRows = await queryDb(
  'select id, deleted_at from service_workers where id = any($1::uuid[]) order by id',
  [[workerA.body.item.id, workerB.body.item.id]],
);
assert.equal(workerRows.rows.length, 2);
assert.ok(workerRows.rows.find((row) => row.id === workerA.body.item.id)?.deleted_at);
assert.equal(
  workerRows.rows.find((row) => row.id === workerB.body.item.id)?.deleted_at,
  null,
);

const disableSales = await request(`/users/${createUser.body.item.id}`, {
  token,
  method: 'PATCH',
  body: JSON.stringify({ status: 'disabled' }),
});
assert.equal(disableSales.status, 200);
const disabledToken = await request('/customers', { token: salesLogin.body.token });
assert.equal(disabledToken.status, 401);
const disabledLogin = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username: salesName, password: 'sales-pass-2026' }),
});
assert.equal(disabledLogin.status, 401);

await request('/auth/logout', { token, method: 'POST' });
const revoked = await request('/auth/me', { token });
assert.equal(revoked.status, 401);
const relogin = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'demo2026',
  }),
});
assert.equal(relogin.status, 200);
const persisted = await request(
  `/customers?q=${encodeURIComponent(`客户B-${stamp}`)}`,
  { token: relogin.body.token },
);
assert.equal(persisted.body.items.length, 1);
console.log('PostgreSQL API integration flow passed.');
