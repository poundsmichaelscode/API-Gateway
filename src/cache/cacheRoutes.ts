import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../auth/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { invalidateByPattern } from './cacheService';

const router = Router();
const schema = z.object({ pattern: z.string().min(3).default('cache:*') });

router.post('/internal/cache/invalidate', authenticate, requireRole('admin', 'developer'), asyncHandler(async (req, res) => {
  const { pattern } = schema.parse(req.body);
  const deleted = await invalidateByPattern(pattern);
  res.json({ deleted });
}));

export { router as cacheRouter };
