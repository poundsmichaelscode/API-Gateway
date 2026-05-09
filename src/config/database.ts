import { Pool } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

db.on('error', (error) => logger.error({ error }, 'PostgreSQL pool error'));

export async function closeDatabase() {
  await db.end();
}
