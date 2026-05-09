import CircuitBreaker from 'opossum';
import { logger } from '../utils/logger';

export function createCircuitBreaker<T extends unknown[], R>(name: string, action: (...args: T) => Promise<R>) {
  const breaker = new CircuitBreaker(action, {
    timeout: 8000,
    errorThresholdPercentage: 50,
    resetTimeout: 15000,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10
  });

  breaker.on('open', () => logger.warn({ service: name }, 'Circuit opened'));
  breaker.on('halfOpen', () => logger.warn({ service: name }, 'Circuit half-open'));
  breaker.on('close', () => logger.info({ service: name }, 'Circuit closed'));
  breaker.fallback(() => ({ statusCode: 503, body: { error: `${name} temporarily unavailable`, fallback: true } } as R));
  return breaker;
}
