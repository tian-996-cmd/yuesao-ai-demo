import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { eq } from 'drizzle-orm';
import Fastify from 'fastify';
import { flattenError, ZodError } from 'zod';
import { loadConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { users } from './db/schema.js';
import { AppError, databaseErrorCode } from './errors.js';
import { registerRoutes } from './routes.js';

const config = loadConfig();
const app = Fastify({
  logger: { level: config.LOG_LEVEL },
  trustProxy: true,
  bodyLimit: 1_048_576,
});
const { db, pool } = createDatabase(config);

await app.register(cors, {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = config.CORS_ORIGIN.split(',').map((x) => x.trim());
    callback(null, allowed.includes(origin));
  },
  credentials: false,
});
await app.register(jwt, { secret: config.JWT_SECRET });

app.decorate('authenticate', async function (request) {
  await request.jwtVerify();
  const [account] = await db
    .select({ status: users.status, tokenVersion: users.tokenVersion })
    .from(users)
    .where(eq(users.id, request.user.id))
    .limit(1);
  if (
    !account ||
    account.status !== 'active' ||
    account.tokenVersion !== request.user.tokenVersion
  ) {
    throw new AppError(401, 'SESSION_EXPIRED', '登录状态已失效，请重新登录');
  }
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError)
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: '提交的数据不符合要求',
        details: flattenError(error),
      },
    });
  if (error instanceof AppError)
    return reply.code(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  const pgCode = databaseErrorCode(error);
  if (pgCode === '23505')
    return reply.code(409).send({
      error: { code: 'DUPLICATE_RECORD', message: '相同的唯一数据已经存在' },
    });
  if (pgCode === '23P01')
    return reply.code(409).send({
      error: {
        code: 'SCHEDULE_CONFLICT',
        message: '该人员当前时间段已有服务安排。',
      },
    });
  if (pgCode === '23503')
    return reply.code(409).send({
      error: {
        code: 'RELATION_CONFLICT',
        message: '关联的数据不存在或仍被其他业务记录使用',
      },
    });
  if ((error as { statusCode?: number }).statusCode === 401)
    return reply.code(401).send({
      error: { code: 'UNAUTHORIZED', message: '请先登录后再继续操作' },
    });
  request.log.error({ err: error }, 'Unhandled request error');
  return reply.code(500).send({
    error: { code: 'INTERNAL_ERROR', message: '服务器暂时无法处理请求' },
  });
});

await registerRoutes(app, db);
app.addHook('onClose', async () => pool.end());

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}
import type { FastifyRequest } from 'fastify';

await app.listen({ host: config.HOST, port: config.PORT });
