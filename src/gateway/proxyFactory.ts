import type { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { ServiceDefinition } from '../services/serviceRegistry';
import { proxyErrorsTotal } from '../monitoring/metrics';
import { logger } from '../utils/logger';
import { cachePolicy } from '../cache/cacheMiddleware';

export function registerProxy(app: Express, service: ServiceDefinition) {
  const middlewares = [];
  if (service.cache) middlewares.push(cachePolicy(service.cache.ttlSeconds, service.cache.staleSeconds));

  app.use(
    service.prefix,
    ...middlewares,
    createProxyMiddleware({
      target: service.target,
      changeOrigin: true,
      proxyTimeout: service.timeoutMs,
      timeout: service.timeoutMs,
      pathRewrite: { [`^${service.prefix}`]: '' },
      on: {
        proxyReq(proxyReq, req) {
          proxyReq.setHeader('x-request-id', req.requestId);
          proxyReq.setHeader('x-correlation-id', req.correlationId);
          if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
            proxyReq.setHeader('x-user-role', req.user.role);
          }
        },
        proxyRes(proxyRes, req) {
          proxyRes.headers['x-gateway-service'] = service.name;
          logger.info({ service: service.name, path: req.url, statusCode: proxyRes.statusCode }, 'Proxy response');
        },
        error(error, req, res) {
          proxyErrorsTotal.labels(service.name).inc();
          logger.error({ error, service: service.name, path: req.url }, 'Proxy error');
          if (!res.headersSent) {
            res.writeHead(502, { 'content-type': 'application/json' });
          }
          res.end(JSON.stringify({ error: `${service.name} service unavailable`, requestId: req.requestId }));
        }
      }
    })
  );
}
