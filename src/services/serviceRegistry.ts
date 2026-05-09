import { env } from '../config/env';

export interface ServiceDefinition {
  name: string;
  prefix: string;
  target: string;
  timeoutMs: number;
  cache?: { ttlSeconds: number; staleSeconds: number };
}

export const serviceRegistry: ServiceDefinition[] = [
  { name: 'users', prefix: '/users', target: env.USERS_SERVICE_URL, timeoutMs: env.REQUEST_TIMEOUT_MS, cache: { ttlSeconds: 30, staleSeconds: 30 } },
  { name: 'payments', prefix: '/payments', target: env.PAYMENTS_SERVICE_URL, timeoutMs: env.REQUEST_TIMEOUT_MS },
  { name: 'analytics', prefix: '/analytics', target: env.ANALYTICS_SERVICE_URL, timeoutMs: env.REQUEST_TIMEOUT_MS, cache: { ttlSeconds: 15, staleSeconds: 15 } }
];
