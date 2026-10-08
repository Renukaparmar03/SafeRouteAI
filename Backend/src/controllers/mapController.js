import { findNearbyServices, reverseGeocode, searchPlaces } from '../services/mapService.js';
import { analyzeRoutes } from '../services/routeAnalysisService.js';
import { notFound, sendSuccess } from '../utils/responseUtils.js';

// GET /api/map/search?q=&lat=&lng=
export const search = async (req, res) => {
  const results = await searchPlaces(req.valid.query);
  sendSuccess(res, { results });
};

// GET /api/map/reverse-geocode?lat=&lng=
export const reverse = async (req, res) => {
  const place = await reverseGeocode(req.valid.query);
  if (!place) throw notFound('No address found for these coordinates.');
  sendSuccess(res, { place });
};

// POST /api/map/route
export const route = async (req, res) => {
  const { from, destination, travelMode, routePreference, departureTime, steps } = req.valid.body;
  const analysis = await analyzeRoutes({ from, destination, travelMode, routePreference, departureTime, steps });
  sendSuccess(res, analysis);
};

// GET /api/map/nearby?lat=&lng=&category=
export const nearby = async (req, res) => {
  const result = await findNearbyServices(req.valid.query);
  sendSuccess(res, result);
};
