import type { NextFunction, Request, Response } from 'express';
import { httpRequestDuration, httpRequestsTotal } from '../monitoring/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    const diff = req.startTime ? Number(process.hrtime.bigint() - req.startTime) / 1e9 : 0;
    const route = req.route?.path || req.baseUrl || req.path || 'unknown';
    httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(diff);
    httpRequestsTotal.labels(req.method, route, String(res.statusCode)).inc();
  });
  next();
}
