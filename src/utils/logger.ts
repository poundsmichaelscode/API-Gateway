import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: env.APP_NAME, env: env.NODE_ENV },
  redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'refreshToken']
});
