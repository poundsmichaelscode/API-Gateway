import type { Role } from '../auth/types';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
      user?: {
        id: string;
        email: string;
        role: Role;
      };
      startTime?: bigint;
      cachePolicy?: {
        ttlSeconds: number;
        staleSeconds: number;
      };
    }
  }
}
export {};
