import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const AUTH_COOKIE = 'saferoute_token';

export const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  // Cross-site deployments (frontend and API on different domains) need "none".
  sameSite: env.isProduction ? 'none' : 'lax',
  path: '/',
});

export const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
};

/** Extracts the auth token from a raw Cookie header (used by Socket.IO). */
export const readTokenFromCookieHeader = (cookieHeader = '') => {
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(AUTH_COOKIE.length + 1)) : null;
};
