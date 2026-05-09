import { LRUCache } from 'lru-cache';
import { redis } from '../config/redis';
import { env } from '../config/env';

export interface CacheRecord { body: unknown; statusCode: number; headers: Record<string, string>; expiresAt: number; staleUntil: number; }

const memoryCache = new LRUCache<string, CacheRecord>({ max: 1000, ttl: env.CACHE_DEFAULT_TTL_SECONDS * 1000 });

export function buildCacheKey(method: string, originalUrl: string, userId?: string) {
  return `cache:${method}:${originalUrl}:${userId || 'anonymous'}`;
}

export async function getCache(key: string): Promise<{ layer: 'memory' | 'redis'; value: CacheRecord; stale: boolean } | null> {
  const now = Date.now();
  const memory = memoryCache.get(key);
  if (memory && memory.staleUntil > now) return { layer: 'memory', value: memory, stale: memory.expiresAt < now };

  const raw = await redis.get(key);
  if (!raw) return null;
  const value = JSON.parse(raw) as CacheRecord;
  if (value.staleUntil <= now) return null;
  memoryCache.set(key, value);
  return { layer: 'redis', value, stale: value.expiresAt < now };
}

export async function setCache(key: string, record: CacheRecord) {
  memoryCache.set(key, record);
  const ttlSeconds = Math.ceil((record.staleUntil - Date.now()) / 1000);
  await redis.set(key, JSON.stringify(record), 'EX', Math.max(ttlSeconds, 1));
}

export async function invalidateByPattern(pattern: string) {
  const stream = redis.scanStream({ match: pattern, count: 100 });
  const keys: string[] = [];
  for await (const batch of stream) keys.push(...batch);
  if (keys.length) await redis.del(...keys);
  memoryCache.clear();
  return keys.length;
}
