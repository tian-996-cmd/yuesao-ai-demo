import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './backend/src/db/schema.ts',
  out: './backend/drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/jiazheng',
  },
  strict: true,
});
