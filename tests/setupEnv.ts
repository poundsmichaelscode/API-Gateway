process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-16';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-16';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://gateway:gateway_password@localhost:5432/gateway_analytics';
process.env.API_KEYS = '';
