import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { badRequest, forbidden, sendSuccess, unauthorized } from '../utils/responseUtils.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/tokenUtils.js';

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, phone, password, role, adminCode } = req.valid.body;

  let userRole = 'user';
  if (role === 'admin') {
    if (!env.adminRegistrationCode) throw forbidden('Admin registration is disabled on this server.');
    if (!adminCode || !safeEqual(adminCode, env.adminRegistrationCode)) throw forbidden('Invalid admin access code.');
    userRole = 'admin';
  }

  const or = [email && { email }, phone && { phone }].filter(Boolean);
  if (await User.exists({ $or: or })) throw badRequest('An account with this email or phone already exists.');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, phone, passwordHash, role: userRole });

  setAuthCookie(res, signToken(user));
  sendSuccess(res, { user: user.toPublicJSON() }, 201);
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { emailOrPhone, password, role } = req.valid.body;
  const identifier = emailOrPhone.includes('@') ? { email: emailOrPhone.toLowerCase() } : { phone: emailOrPhone };

  const user = await User.findOne(identifier).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw unauthorized('Invalid email/phone or password.');
  if (!user.isActive) throw forbidden('This account has been suspended. Contact support.');
  if (role === 'admin' && user.role !== 'admin') throw forbidden('This account does not have admin access.');

  user.lastLoginAt = new Date();
  await user.save();

  setAuthCookie(res, signToken(user));
  sendSuccess(res, { user: user.toPublicJSON() });
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { loggedOut: true });
};

// GET /api/auth/me
export const me = async (req, res) => {
  sendSuccess(res, { user: req.user.toPublicJSON() });
};
