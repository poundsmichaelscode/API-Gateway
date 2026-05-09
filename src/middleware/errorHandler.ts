import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/httpError';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof HttpError ? error.message : 'Internal server error';

  logger.error({
    error: { message: error.message, stack: error.stack },
    requestId: req.requestId,
    correlationId: req.correlationId,
    path: req.path
  }, 'Request failed');

  res.status(statusCode).json({
    error: message,
    requestId: req.requestId,
    details: error instanceof HttpError ? error.details : undefined
  });
};
