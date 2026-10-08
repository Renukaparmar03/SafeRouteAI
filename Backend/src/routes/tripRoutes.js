import express from 'express';
import { createTrip, deleteTrip, endTrip, getTrip, listTrips, startTrip, updateTrip } from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createTripSchema, idParams, tripsQuery, updateTripSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.post('/', validate({ body: createTripSchema }), createTrip);
router.get('/', validate({ query: tripsQuery }), listTrips);
router.get('/:id', validate({ params: idParams }), getTrip);
router.put('/:id', validate({ params: idParams, body: updateTripSchema }), updateTrip);
router.delete('/:id', validate({ params: idParams }), deleteTrip);
router.post('/:id/start', validate({ params: idParams }), startTrip);
router.post('/:id/end', validate({ params: idParams }), endTrip);

export default router;
