import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './tokenService';
import type { Role } from './types';
import { HttpError } from '../utils/httpError';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing bearer token');
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired access token');
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    // Optional auth intentionally ignores invalid tokens for public endpoints.
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'Insufficient permissions');
    next();
  };
}
