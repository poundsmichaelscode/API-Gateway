import { Router } from 'express';
import { z } from 'zod';
import { redis } from '../config/redis';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { findUserByEmail, findUserById, verifyPassword } from './userStore';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './tokenService';
import { authEndpointLimiter } from '../middleware/security';

const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const refreshSchema = z.object({ refreshToken: z.string().min(20) });

router.post('/login', authEndpointLimiter, asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await findUserByEmail(body.email);
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await redis.set(`refresh:${user.id}:${refreshToken}`, 'valid', 'EX', 7 * 24 * 60 * 60);

  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
}));

router.post('/refresh', authEndpointLimiter, asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const payload = verifyRefreshToken(refreshToken);
  const key = `refresh:${payload.sub}:${refreshToken}`;
  const exists = await redis.get(key);
  if (!exists) throw new HttpError(401, 'Refresh token revoked or expired');
  const user = await findUserById(payload.sub);
  if (!user) throw new HttpError(401, 'User no longer exists');
  const newPayload = { sub: user.id, email: user.email, role: user.role };
  res.json({ accessToken: signAccessToken(newPayload), refreshToken });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const payload = verifyRefreshToken(refreshToken);
  await redis.del(`refresh:${payload.sub}:${refreshToken}`);
  res.status(204).send();
}));

export { router as authRouter };
