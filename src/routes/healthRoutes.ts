import { Router } from 'express';
import { redis } from '../config/redis';
import { db } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/health', asyncHandler(async (_req, res) => {
  const redisStatus = redis.status;
  await db.query('SELECT 1');
  res.json({ status: 'ok', redis: redisStatus, postgres: 'ok', uptime: process.uptime() });
}));

router.get('/ready', asyncHandler(async (_req, res) => {
  await Promise.all([redis.ping(), db.query('SELECT 1')]);
  res.json({ ready: true });
}));

export { router as healthRouter };
