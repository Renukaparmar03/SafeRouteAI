import express from 'express';
import { activeSos, cancelSos, services, triggerSos } from '../controllers/emergencyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { idParams, nearbyQuery, sosSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/services', externalApiLimiter, validate({ query: nearbyQuery }), services);
router.post('/sos', validate({ body: sosSchema }), triggerSos);
router.get('/sos/active', activeSos);
router.put('/sos/:id/cancel', validate({ params: idParams }), cancelSos);

export default router;
