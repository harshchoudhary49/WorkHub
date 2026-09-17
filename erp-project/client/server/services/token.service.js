import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Access token: short-lived, sent on every request, holds identity + role
// so RBAC middleware doesn't need a DB hit on every request.
export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );

// Refresh token: long-lived, stored only as an httpOnly cookie, used solely
// to mint new access tokens via /auth/refresh.
export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

// We never store the raw refresh token in the DB - only a hash of it. This
// way a database leak alone can't be used to mint sessions.
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const REFRESH_COOKIE_NAME = 'erp_refresh_token';

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_REFRESH_EXPIRES_IN default
  path: '/api/auth', // cookie is only sent to auth endpoints (refresh/logout)
});
