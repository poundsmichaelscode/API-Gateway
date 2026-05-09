import { Router } from 'express';
import { prometheusClient } from '../monitoring/metrics';
import { asyncHandler } from '../utils/asyncHandler';
import { topEndpoints } from '../analytics/analyticsRepository';
import { authenticate, requireRole } from '../auth/authMiddleware';

const router = Router();

router.get('/metrics', asyncHandler(async (_req, res) => {
  res.setHeader('Content-Type', prometheusClient.register.contentType);
  res.send(await prometheusClient.register.metrics());
}));

router.get('/internal/top-endpoints', authenticate, requireRole('admin', 'developer'), asyncHandler(async (_req, res) => {
  res.json({ endpoints: await topEndpoints() });
}));

export { router as monitoringRouter };
