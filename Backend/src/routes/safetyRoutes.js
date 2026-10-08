import express from 'express';
import { check, forecast } from '../controllers/safetyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { latLngQuery } from '../validators/schemas.js';

const router = express.Router();
router.use(protect, externalApiLimiter);

router.get('/check', validate({ query: latLngQuery }), check);
router.get('/forecast', validate({ query: latLngQuery }), forecast);

export default router;
