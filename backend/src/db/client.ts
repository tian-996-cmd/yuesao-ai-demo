import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { AppConfig } from '../config.js';
import * as schema from './schema.js';

export function createDatabase(config: AppConfig) {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export type Database = ReturnType<typeof createDatabase>['db'];
