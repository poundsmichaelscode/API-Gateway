import type { NextFunction, Request, Response } from 'express';
import { persistRequestEvent } from './analyticsRepository';
import { logger } from '../utils/logger';

export function analyticsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    const latencyMs = req.startTime ? Number(process.hrtime.bigint() - req.startTime) / 1e6 : 0;
    void persistRequestEvent({
      requestId: req.requestId,
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs,
      userId: req.user?.id,
      ip: req.ip
    }).catch((error) => logger.warn({ error }, 'Failed to persist request analytics'));
  });
  next();
}
