import { signAccessToken, verifyAccessToken } from '../../src/auth/tokenService';

describe('JWT token service', () => {
  it('signs and verifies access tokens', () => {
    const token = signAccessToken({ sub: '1', email: 'admin@example.com', role: 'admin' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('1');
    expect(payload.role).toBe('admin');
  });
});
