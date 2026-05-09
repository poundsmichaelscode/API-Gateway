import express from 'express';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { requestContext } from './middleware/requestContext';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { analyticsMiddleware } from './analytics/analyticsMiddleware';
import { apiKeyMiddleware, corsMiddleware, helmetMiddleware, inputSanitization, ipWhitelistMiddleware } from './middleware/security';
import { optionalAuthenticate } from './auth/authMiddleware';
import { distributedRateLimiter } from './rate-limit/slidingWindowLimiter';
import { responseCache } from './cache/cacheMiddleware';
import { authRouter } from './auth/authController';
import { healthRouter } from './routes/healthRoutes';
import { monitoringRouter } from './routes/monitoringRoutes';
import { cacheRouter } from './cache/cacheRoutes';
import { serviceRegistry } from './services/serviceRegistry';
import { registerProxy } from './gateway/proxyFactory';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(requestContext);
  app.use(pinoHttp({ logger, genReqId: (req) => req.requestId }));
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(inputSanitization);
  app.use(metricsMiddleware);
  app.use(analyticsMiddleware);

  app.use(healthRouter);
  app.use(monitoringRouter);
  app.use('/auth', authRouter);
  app.use(cacheRouter);

  app.use(optionalAuthenticate);
  app.use(ipWhitelistMiddleware);
  app.use(apiKeyMiddleware);
  app.use(distributedRateLimiter);
  app.use(responseCache);

  serviceRegistry.forEach((service) => registerProxy(app, service));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
