import express from 'express';
import {
  listAlerts,
  listTrips,
  listUsers,
  notificationHistory,
  resolveAlert,
  stats,
  systemStatus,
  updateUser,
} from '../controllers/adminController.js';
import { createZone, deleteZone, listZones, updateZone } from '../controllers/riskZoneController.js';
import { sendNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  adminAlertsQuery,
  adminNotificationSchema,
  adminTripsQuery,
  adminUsersQuery,
  adminUserUpdateSchema,
  idParams,
  riskZoneSchema,
  riskZoneUpdateSchema,
  zonesQuery,
} from '../validators/schemas.js';

const router = express.Router();
router.use(protect, requireAdmin);

router.get('/stats', stats);
router.get('/system-status', systemStatus);

router.get('/users', validate({ query: adminUsersQuery }), listUsers);
router.put('/users/:id', validate({ params: idParams, body: adminUserUpdateSchema }), updateUser);

router.get('/trips', validate({ query: adminTripsQuery }), listTrips);

router.get('/alerts', validate({ query: adminAlertsQuery }), listAlerts);
router.put('/alerts/:id/resolve', validate({ params: idParams }), resolveAlert);

router.get('/risk-zones', validate({ query: zonesQuery }), listZones);
router.post('/risk-zones', validate({ body: riskZoneSchema }), createZone);
router.put('/risk-zones/:id', validate({ params: idParams, body: riskZoneUpdateSchema }), updateZone);
router.delete('/risk-zones/:id', validate({ params: idParams }), deleteZone);

router.get('/notifications', notificationHistory);
router.post('/notifications', validate({ body: adminNotificationSchema }), sendNotification);

export default router;
