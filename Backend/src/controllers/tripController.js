import Trip from '../models/Trip.js';
import Alert from '../models/Alert.js';
import RiskZone from '../models/RiskZone.js';
import LocationPoint from '../models/LocationPoint.js';
import { ApiError, badRequest, notFound, sendSuccess } from '../utils/responseUtils.js';
import { serializeAlert, serializeTrip } from '../utils/serializers.js';
import { simplifyLine } from '../utils/geoUtils.js';
import { analyzeRoutes, scoreSingleRoute } from '../services/routeAnalysisService.js';
import { getWeather, summarizeWeather } from '../services/weatherService.js';
import { endJourney, loadOwnedTrip, startJourney } from '../services/trackingService.js';
import { PROFILE_BY_MODE } from '../services/mapService.js';

const safeWeather = async (lat, lng) => {
  try {
    return await getWeather({ lat, lng });
  } catch {
    return null;
  }
};

/** Builds the stored route; scores are always recomputed on the server. */
const buildSelectedRoute = async ({ from, destination, travelMode, routePreference, travelDate, selectedRoute }) => {
  if (selectedRoute) {
    const geometry = simplifyLine(selectedRoute.geometry);
    const [originWeather, destinationWeather] = await Promise.all([
      safeWeather(from.latitude, from.longitude),
      safeWeather(destination.latitude, destination.longitude),
    ]);
    const scored = await scoreSingleRoute({
      route: { geometry, distance: selectedRoute.distance, duration: selectedRoute.duration },
      originWeather,
      destinationWeather,
      departureTime: travelDate,
    });
    return {
      route: {
        summary: selectedRoute.summary,
        geometry,
        distance: selectedRoute.distance,
        duration: selectedRoute.duration,
        steps: selectedRoute.steps || [],
        profile: selectedRoute.profile || PROFILE_BY_MODE[travelMode],
        safetyScore: scored.score,
        riskLevel: scored.riskLevel,
        factors: scored.factors,
        recommendation: scored.recommendation,
        riskZoneIds: scored.zones.map((z) => z.id),
      },
      weatherSummary: summarizeWeather(destinationWeather),
    };
  }

  try {
    const analysis = await analyzeRoutes({ from, destination, travelMode, routePreference, departureTime: travelDate });
    const best = analysis.routes[0];
    return {
      route: {
        summary: best.summary,
        geometry: best.geometry,
        distance: best.distance,
        duration: best.duration,
        steps: best.steps,
        profile: best.profile,
        safetyScore: best.safetyScore,
        riskLevel: best.riskLevel,
        factors: best.factors,
        recommendation: best.recommendation,
        riskZoneIds: best.zones.map((z) => z.id),
      },
      weatherSummary: analysis.weather.destination?.summary || null,
    };
  } catch (error) {
    // Without a routing provider the trip is still saved, just without route analysis.
    if (error instanceof ApiError && error.statusCode === 503) return { route: null, weatherSummary: null };
    throw error;
  }
};

// POST /api/trips
export const createTrip = async (req, res) => {
  const body = req.valid.body;
  const { route, weatherSummary } = await buildSelectedRoute(body);

  const trip = await Trip.create({
    userId: req.user._id,
    from: body.from,
    destination: body.destination,
    travelDate: body.travelDate,
    travelers: body.travelers,
    travelMode: body.travelMode,
    routePreference: body.routePreference,
    selectedRoute: route || undefined,
    distance: route?.distance,
    duration: route?.duration,
    safetyScore: route?.safetyScore,
    weatherSummary,
  });
  sendSuccess(res, { trip: serializeTrip(trip) }, 201);
};

// GET /api/trips?status=
export const listTrips = async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.valid.query.status) filter.status = req.valid.query.status;
  const trips = await Trip.find(filter)
    .select('-selectedRoute.steps -selectedRoute.geometry')
    .sort({ status: 1, travelDate: -1 })
    .lean();
  sendSuccess(res, { trips: trips.map((t) => serializeTrip(t, { includeRoute: false })) });
};

// GET /api/trips/:id
export const getTrip = async (req, res) => {
  const trip = await loadOwnedTrip(req.user._id, req.valid.params.id);
  const [alerts, zones, weather, pointCount] = await Promise.all([
    Alert.find({ tripId: trip._id }).sort({ createdAt: -1 }).limit(50),
    trip.selectedRoute?.riskZoneIds?.length ? RiskZone.find({ _id: { $in: trip.selectedRoute.riskZoneIds } }) : [],
    safeWeather(trip.destination.latitude, trip.destination.longitude),
    LocationPoint.countDocuments({ tripId: trip._id }),
  ]);

  sendSuccess(res, {
    trip: serializeTrip(trip),
    alerts: alerts.map(serializeAlert),
    riskZones: { type: 'FeatureCollection', features: zones.map((z) => z.toFeature()) },
    weather: weather ? { summary: summarizeWeather(weather), current: weather.current, daily: weather.daily } : null,
    tracking: { locationPoints: pointCount },
  });
};

// PUT /api/trips/:id
export const updateTrip = async (req, res) => {
  const trip = await loadOwnedTrip(req.user._id, req.valid.params.id);
  if (trip.status !== 'planned') throw badRequest('Only planned trips can be edited.');
  Object.assign(trip, req.valid.body);
  await trip.save();
  sendSuccess(res, { trip: serializeTrip(trip) });
};

// DELETE /api/trips/:id
export const deleteTrip = async (req, res) => {
  const trip = await Trip.findOne({ _id: req.valid.params.id, userId: req.user._id });
  if (!trip) throw notFound('Trip not found');
  if (trip.status === 'active') throw badRequest('End the journey before deleting this trip.');
  await Promise.all([trip.deleteOne(), LocationPoint.deleteMany({ tripId: trip._id })]);
  sendSuccess(res, { deleted: true });
};

// POST /api/trips/:id/start
export const startTrip = async (req, res) => {
  const trip = await startJourney(req.user, req.valid.params.id);
  sendSuccess(res, { trip });
};

// POST /api/trips/:id/end
export const endTrip = async (req, res) => {
  const trip = await endJourney(req.user, req.valid.params.id);
  sendSuccess(res, { trip });
};
