import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  lazyConnect: true
});

redis.on('error', (error) => logger.error({ error }, 'Redis error'));
redis.on('connect', () => logger.info('Redis connected'));

export async function connectRedis() {
  if (redis.status === 'wait') await redis.connect();
}

export async function closeRedis() {
  await redis.quit();
}
