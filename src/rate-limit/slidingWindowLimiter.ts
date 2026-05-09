import type { NextFunction, Request, Response } from 'express';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { rateLimitViolationsTotal } from '../monitoring/metrics';
import { HttpError } from '../utils/httpError';

interface LimitConfig { limit: number; windowSeconds: number; scope: string; }

async function checkSlidingWindow(key: string, config: LimitConfig) {
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;
  const redisKey = `rl:${config.scope}:${key}`;

  const results = await redis.multi()
    .zremrangebyscore(redisKey, 0, windowStart)
    .zadd(redisKey, now, `${now}:${Math.random()}`)
    .zcard(redisKey)
    .expire(redisKey, config.windowSeconds + 5)
    .exec();

  const count = Number(results?.[2]?.[1] || 0);
  const remaining = Math.max(config.limit - count, 0);
  return { allowed: count <= config.limit, count, remaining, retryAfterSeconds: config.windowSeconds };
}

export async function distributedRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') return next();

  const isAuthenticated = Boolean(req.user);
  const limit = isAuthenticated ? env.AUTH_RATE_LIMIT_PER_MINUTE : env.PUBLIC_RATE_LIMIT_PER_MINUTE;
  const identifier = isAuthenticated ? `user:${req.user!.id}` : `ip:${req.ip}`;
  const scope = isAuthenticated ? 'user' : 'ip';

  const result = await checkSlidingWindow(identifier, { limit, windowSeconds: 60, scope });
  res.setHeader('x-ratelimit-limit', String(limit));
  res.setHeader('x-ratelimit-remaining', String(result.remaining));
  res.setHeader('x-ratelimit-window', '60');

  if (!result.allowed) {
    res.setHeader('retry-after', String(result.retryAfterSeconds));
    rateLimitViolationsTotal.labels(scope).inc();
    throw new HttpError(429, 'Rate limit exceeded', { retryAfterSeconds: result.retryAfterSeconds });
  }
  next();
}
