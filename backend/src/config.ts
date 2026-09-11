import { z } from 'zod';

const configSchema = z
  .object({
    APP_ENV: z
      .enum(['development', 'demo', 'test', 'production'])
      .default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    BOOTSTRAP_ADMIN_USERNAME: z.string().min(3).default('admin'),
    BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).default('demo2026'),
  })
  .superRefine((value, context) => {
    if (
      value.APP_ENV === 'production' &&
      (value.BOOTSTRAP_ADMIN_PASSWORD === 'demo2026' ||
        value.BOOTSTRAP_ADMIN_PASSWORD.length < 12)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['BOOTSTRAP_ADMIN_PASSWORD'],
        message: '正式环境初始管理员密码必须至少 12 位且不能使用演示密码',
      });
    }
  });

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env = process.env): AppConfig {
  const merged = {
    ...env,
    DATABASE_URL:
      env.DATABASE_URL ??
      (env.APP_ENV === 'production'
        ? ''
        : 'postgresql://postgres:postgres@localhost:5432/jiazheng'),
    JWT_SECRET:
      env.JWT_SECRET ??
      (env.APP_ENV === 'production'
        ? ''
        : 'development-only-secret-change-before-production'),
  };
  return configSchema.parse(merged);
}
