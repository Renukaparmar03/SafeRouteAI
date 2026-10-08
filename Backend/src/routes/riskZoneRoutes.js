import express from 'express';
import { getZone, listZones, nearbyZones } from '../controllers/riskZoneController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { idParams, nearbyZonesQuery, zonesQuery } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/', validate({ query: zonesQuery }), listZones);
router.get('/nearby', validate({ query: nearbyZonesQuery }), nearbyZones);
router.get('/:id', validate({ params: idParams }), getZone);

export default router;
