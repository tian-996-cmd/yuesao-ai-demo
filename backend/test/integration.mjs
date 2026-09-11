import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3001/api/v1';
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
const unauthorized = await request('/customers');
assert.equal(unauthorized.status, 401);
const login = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    username: process.env.BOOTSTRAP_ADMIN_USERNAME ?? 'admin',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'demo2026',
  }),
});
assert.equal(login.status, 200);
const token = login.body.token;
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
const orderPayload = {
  customerId: customerA.body.item.id,
  workerId: workerA.body.item.id,
  serviceType: '老人陪护',
  status: 'confirmed',
  startDate: '2027-10-01',
  endDate: '2027-10-20',
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
    workerId: null,
    startDate: '2027-11-01',
    endDate: '2027-11-20',
    createSchedule: false,
  }),
});
assert.equal(order1.status, 201);
assert.equal(order2.status, 201);
assert.notEqual(order1.body.item.id, order2.body.item.id);
const conflict = await request('/schedules', {
  token,
  method: 'POST',
  body: JSON.stringify({
    workerId: workerA.body.item.id,
    startTime: '2027-10-10',
    endTime: '2027-10-30',
    status: 'confirmed',
  }),
});
assert.equal(conflict.status, 409);
assert.equal(conflict.body.error.code, 'SCHEDULE_CONFLICT');
const alternate = await request('/schedules', {
  token,
  method: 'POST',
  body: JSON.stringify({
    workerId: workerB.body.item.id,
    startTime: '2027-10-10',
    endTime: '2027-10-30',
    status: 'confirmed',
  }),
});
assert.equal(alternate.status, 201);

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
    startDate: '2027-10-15',
    endDate: '2027-10-25',
  }),
});
assert.equal(conflictingOrderEdit.status, 409);
assert.equal(conflictingOrderEdit.body.error.code, 'SCHEDULE_CONFLICT');

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
  `/customers?q=${encodeURIComponent(`客户A-${stamp}`)}`,
  { token: relogin.body.token },
);
assert.equal(persisted.body.items.length, 1);
console.log('PostgreSQL API integration flow passed.');
