import client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'gateway_' });

export const httpRequestDuration = new client.Histogram({
  name: 'gateway_http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'gateway_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const cacheHitsTotal = new client.Counter({
  name: 'gateway_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['layer']
});

export const cacheMissesTotal = new client.Counter({
  name: 'gateway_cache_misses_total',
  help: 'Total cache misses'
});

export const rateLimitViolationsTotal = new client.Counter({
  name: 'gateway_rate_limit_violations_total',
  help: 'Total rate limit violations',
  labelNames: ['scope']
});

export const proxyErrorsTotal = new client.Counter({
  name: 'gateway_proxy_errors_total',
  help: 'Total proxy errors',
  labelNames: ['service']
});

export const activeUsersGauge = new client.Gauge({
  name: 'gateway_active_users',
  help: 'Approximate active users in the current window'
});

export { client as prometheusClient };
