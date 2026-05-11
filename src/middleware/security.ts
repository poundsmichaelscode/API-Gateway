import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { apiKeys, corsOrigins, ipWhitelist } from '../config/env';
import { HttpError } from '../utils/httpError';

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
});

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS origin not allowed'));
  },
  credentials: true
});

/**
 * Safe input sanitization middleware.
 *
 * We avoid express-mongo-sanitize because newer Express versions expose req.query
 * as a getter-only property, which can cause internal server errors.
 */
export function inputSanitization(req: Request, _res: Response, next: NextFunction) {
  const sanitizeValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    if (value && typeof value === 'object') {
      const cleaned: Record<string, unknown> = {};

      for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        if (key.startsWith('$') || key.includes('.')) {
          continue;
        }

        cleaned[key] = sanitizeValue(nestedValue);
      }

      return cleaned;
    }

    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.params) {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }

  next();
}

export const authEndpointLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

export function apiKeyMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (apiKeys.size === 0) return next();

  if (
    req.path.startsWith('/health') ||
    req.path.startsWith('/metrics') ||
    req.path.startsWith('/auth')
  ) {
    return next();
  }

  const key = req.header('x-api-key');

  if (!key || !apiKeys.has(key)) {
    throw new HttpError(401, 'Missing or invalid API key');
  }

  next();
}

export function ipWhitelistMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (ipWhitelist.size === 0) return next();

  const ip = req.ip || req.socket.remoteAddress || '';

  if (!ipWhitelist.has(ip)) {
    throw new HttpError(403, 'IP address is not allowed');
  }

  next();
}