import express from 'express';
import { nearby, reverse, route, search } from '../controllers/mapController.js';
import { protect } from '../middleware/authMiddleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { latLngQuery, nearbyQuery, routeRequestSchema, searchQuery } from '../validators/schemas.js';

const router = express.Router();
router.use(protect, externalApiLimiter);

router.get('/search', validate({ query: searchQuery }), search);
router.get('/reverse-geocode', validate({ query: latLngQuery }), reverse);
router.post('/route', validate({ body: routeRequestSchema }), route);
router.get('/nearby', validate({ query: nearbyQuery }), nearby);

export default router;
