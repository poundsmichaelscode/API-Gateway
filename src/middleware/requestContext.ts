import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incomingRequestId = req.header('x-request-id');
  const incomingCorrelationId = req.header('x-correlation-id');
  req.requestId = incomingRequestId || randomUUID();
  req.correlationId = incomingCorrelationId || req.requestId;
  req.startTime = process.hrtime.bigint();
  res.setHeader('x-request-id', req.requestId);
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}
