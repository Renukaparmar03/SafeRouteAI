import express from 'express';
import { weather } from '../controllers/weatherController.js';
import { protect } from '../middleware/authMiddleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { latLngQuery } from '../validators/schemas.js';

const router = express.Router();

router.get('/', protect, externalApiLimiter, validate({ query: latLngQuery }), weather);

export default router;
