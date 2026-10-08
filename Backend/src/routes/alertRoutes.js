import express from 'express';
import { listAlerts, markAlertRead, markAllAlertsRead } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', listAlerts);
router.put('/read-all', markAllAlertsRead);
router.put('/:id/read', validate({ params: idParams }), markAlertRead);

export default router;
