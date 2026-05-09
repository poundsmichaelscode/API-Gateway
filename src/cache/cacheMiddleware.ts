import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { buildCacheKey, getCache, setCache } from './cacheService';
import { cacheHitsTotal, cacheMissesTotal } from '../monitoring/metrics';
import { logger } from '../utils/logger';

export function cachePolicy(ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS, staleSeconds = env.CACHE_STALE_TTL_SECONDS) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.cachePolicy = { ttlSeconds, staleSeconds };
    next();
  };
}

export async function responseCache(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' || !req.cachePolicy) return next();
  const key = buildCacheKey(req.method, req.originalUrl, req.user?.id);
  const cached = await getCache(key);
  if (cached) {
    cacheHitsTotal.labels(cached.layer).inc();
    res.setHeader('x-cache', cached.stale ? 'STALE' : 'HIT');
    Object.entries(cached.value.headers).forEach(([name, value]) => res.setHeader(name, value));
    res.status(cached.value.statusCode).json(cached.value.body);
    if (cached.stale) logger.info({ key }, 'Served stale cache; background revalidation would be triggered here');
    return;
  }
  cacheMissesTotal.inc();

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const now = Date.now();
      void setCache(key, {
        body,
        statusCode: res.statusCode,
        headers: { 'content-type': 'application/json' },
        expiresAt: now + req.cachePolicy!.ttlSeconds * 1000,
        staleUntil: now + (req.cachePolicy!.ttlSeconds + req.cachePolicy!.staleSeconds) * 1000
      });
      res.setHeader('x-cache', 'MISS');
    }
    return originalJson(body);
  };
  next();
}
