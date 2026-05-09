import { buildCacheKey } from '../../src/cache/cacheService';

describe('cache key generation', () => {
  it('builds user-aware cache keys', () => {
    expect(buildCacheKey('GET', '/users/profile?a=1', '42')).toContain('42');
    expect(buildCacheKey('GET', '/users/profile?a=1')).toContain('anonymous');
  });
});
