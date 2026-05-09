import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('high-performance-api-gateway'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:8080'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  DATABASE_URL: z.string().default('postgresql://gateway:gateway_password@localhost:5432/gateway_analytics'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  API_KEYS: z.string().default(''),
  IP_WHITELIST: z.string().default(''),
  LOG_LEVEL: z.string().default('info'),
  CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().default(60),
  CACHE_STALE_TTL_SECONDS: z.coerce.number().default(30),
  PUBLIC_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(1000),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(8000),
  USERS_SERVICE_URL: z.string().url().default('http://localhost:5001'),
  PAYMENTS_SERVICE_URL: z.string().url().default('http://localhost:5002'),
  ANALYTICS_SERVICE_URL: z.string().url().default('http://localhost:5003')
});

export const env = schema.parse(process.env);

export const corsOrigins = env.CORS_ORIGINS.split(',').map((v) => v.trim()).filter(Boolean);
export const apiKeys = new Set(env.API_KEYS.split(',').map((v) => v.trim()).filter(Boolean));
export const ipWhitelist = new Set(env.IP_WHITELIST.split(',').map((v) => v.trim()).filter(Boolean));
