import express from 'express';
import { location, start, stop, track } from '../controllers/trackingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { locationSchema, trackingTripSchema, tripIdParams } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.post('/start', validate({ body: trackingTripSchema }), start);
router.post('/stop', validate({ body: trackingTripSchema }), stop);
router.post('/location', validate({ body: locationSchema }), location);
router.get('/:tripId', validate({ params: tripIdParams }), track);

export default router;
