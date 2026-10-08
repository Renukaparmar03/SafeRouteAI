import User from '../models/User.js';
import { AUTH_COOKIE, verifyToken } from '../utils/tokenUtils.js';
import { unauthorized } from '../utils/responseUtils.js';

/** Loads the user from a JWT string, or returns null when invalid. */
export const resolveUserFromToken = async (token) => {
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
};

/**
 * Requires a valid session. The JWT lives in an HTTP-only cookie; a Bearer
 * header is also accepted for API clients such as Postman or curl.
 */
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.[AUTH_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  const user = await resolveUserFromToken(token);
  if (!user) throw unauthorized('Please log in to continue.');
  req.user = user;
  next();
};
