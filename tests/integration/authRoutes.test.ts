import request from 'supertest';
import { createApp } from '../../src/app';
import { redis } from '../../src/config/redis';
import { db } from '../../src/config/database';

jest.mock('../../src/config/redis', () => ({
  redis: { set: jest.fn().mockResolvedValue('OK'), get: jest.fn().mockResolvedValue('valid'), del: jest.fn().mockResolvedValue(1), status: 'ready', ping: jest.fn().mockResolvedValue('PONG') }
}));

jest.mock('../../src/config/database', () => ({
  db: { query: jest.fn().mockResolvedValue({ rows: [] }) }
}));

describe('auth routes', () => {
  it('logs in a seeded user', async () => {
    const app = createApp();
    const response = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'Password123!' });
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(redis.set).toHaveBeenCalled();
    expect(db.query).toBeDefined();
  });
});
