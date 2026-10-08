import { sendSuccess } from '../utils/responseUtils.js';
import { endJourney, getTripTrack, processLocation, startJourney } from '../services/trackingService.js';

// POST /api/tracking/start  { tripId }
export const start = async (req, res) => {
  const trip = await startJourney(req.user, req.valid.body.tripId);
  sendSuccess(res, { trip });
};

// POST /api/tracking/stop  { tripId }
export const stop = async (req, res) => {
  const trip = await endJourney(req.user, req.valid.body.tripId);
  sendSuccess(res, { trip });
};

// POST /api/tracking/location — REST fallback when the socket is disconnected.
export const location = async (req, res) => {
  const status = await processLocation(req.user, req.valid.body);
  sendSuccess(res, status);
};

// GET /api/tracking/:tripId
export const track = async (req, res) => {
  const data = await getTripTrack(req.user, req.valid.params.tripId);
  sendSuccess(res, data);
};
