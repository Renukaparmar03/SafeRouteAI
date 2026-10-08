import { forbidden } from '../utils/responseUtils.js';

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') throw forbidden('Admin access required.');
  next();
};
