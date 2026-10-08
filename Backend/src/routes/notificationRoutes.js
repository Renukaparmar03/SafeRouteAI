import express from 'express';
import {
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
  pushConfig,
  registerToken,
  sendNotification,
  unregisterToken,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { validate } from '../middleware/validate.js';
import { adminNotificationSchema, idParams, registerTokenSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', listNotifications);
router.get('/config', pushConfig);
router.put('/read-all', markAllRead);
router.put('/:id/read', validate({ params: idParams }), markRead);
router.delete('/:id', validate({ params: idParams }), deleteNotification);
router.post('/register-token', validate({ body: registerTokenSchema }), registerToken);
router.delete('/register-token', validate({ body: registerTokenSchema }), unregisterToken);
router.post('/send', requireAdmin, validate({ body: adminNotificationSchema }), sendNotification);

export default router;
