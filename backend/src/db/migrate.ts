import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../config.js';
import { createDatabase } from './client.js';

const config = loadConfig();
const { db, pool } = createDatabase(config);

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
  });
  console.log('Database migrations completed.');
} finally {
  await pool.end();
}
