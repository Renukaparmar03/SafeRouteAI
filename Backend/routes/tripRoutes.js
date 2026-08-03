import express from 'express';
import { 
  createTrip, 
  getMyTrips, 
  updateTripStatus, 
  deleteTrip 
} from '../controllers/tripController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All trip routes require the user to be logged in
router.use(protect);

router.route('/')
  .post(createTrip)
  .get(getMyTrips);

router.route('/:id/status')
  .put(updateTripStatus);

router.route('/:id')
  .delete(deleteTrip);

export default router;
