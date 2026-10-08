import Trip from '../models/Trip.js';
import Alert from '../models/Alert.js';
import LocationPoint from '../models/LocationPoint.js';
import { env } from '../config/env.js';
import { badRequest, notFound } from '../utils/responseUtils.js';
import { distanceMeters, distanceToRouteMeters, formatDistance, progressAlongRoute } from '../utils/geoUtils.js';
import { serializeAlert, serializeTrip } from '../utils/serializers.js';
import { assessLocation, resolveIsNight } from './riskService.js';
import { getWeather, weatherCodeSeverity } from './weatherService.js';
import { notifyUser } from './notificationService.js';
import { emitToAdmins, emitToUser } from '../sockets/socketEmitter.js';

// Per-trip runtime state (last stored point, last weather check). Lost on
// restart, which only means the next location update is stored immediately.
const tripState = new Map();
const WEATHER_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const WEATHER_ALERT_COOLDOWN_MS = 60 * 60 * 1000;
const MAX_ACCURACY_FOR_DEVIATION = 100; // metres

const getState = (tripId) => {
  if (!tripState.has(tripId)) tripState.set(tripId, { lastStored: null, lastWeatherCheck: 0 });
  return tripState.get(tripId);
};

export const loadOwnedTrip = async (userId, tripId) => {
  const trip = await Trip.findOne({ _id: tripId, userId });
  if (!trip) throw notFound('Trip not found');
  return trip;
};

export const startJourney = async (user, tripId) => {
  const trip = await loadOwnedTrip(user._id, tripId);
  if (trip.status === 'active') return serializeTrip(trip);
  if (trip.status !== 'planned') throw badRequest(`A ${trip.status} trip cannot be started.`);

  const otherActive = await Trip.findOne({ userId: user._id, status: 'active', _id: { $ne: trip._id } });
  if (otherActive) throw badRequest('You already have an active journey. End it before starting another.');

  trip.status = 'active';
  trip.startedAt = new Date();
  await trip.save();
  tripState.delete(trip._id.toString());

  const payload = serializeTrip(trip, { includeRoute: false });
  emitToUser(user._id, 'journey:start', payload);
  emitToAdmins('journey:start', { ...payload, user: { id: user._id.toString(), name: user.name } });
  await notifyUser(user._id, {
    title: 'Your trip has started',
    message: `Live tracking is on for your journey to ${trip.destination.name}.`,
    type: 'TRIP_UPDATE',
    data: { tripId: trip._id.toString() },
  });
  return serializeTrip(trip);
};

export const endJourney = async (user, tripId) => {
  const trip = await loadOwnedTrip(user._id, tripId);
  if (trip.status !== 'active') throw badRequest('Only an active journey can be ended.');

  const [pointCount, alertsCount, lastPoints] = await Promise.all([
    LocationPoint.countDocuments({ tripId: trip._id }),
    Alert.countDocuments({ tripId: trip._id }),
    LocationPoint.find({ tripId: trip._id }).sort({ timestamp: 1 }).select('latitude longitude').lean(),
  ]);

  let travelled = 0;
  for (let i = 1; i < lastPoints.length; i += 1) {
    travelled += distanceMeters(
      { lat: lastPoints[i - 1].latitude, lng: lastPoints[i - 1].longitude },
      { lat: lastPoints[i].latitude, lng: lastPoints[i].longitude }
    );
  }

  trip.status = 'completed';
  trip.endedAt = new Date();
  trip.summary = { locationPoints: pointCount, alertsCount, distanceTravelled: Math.round(travelled) };
  await trip.save();
  tripState.delete(trip._id.toString());

  const payload = serializeTrip(trip, { includeRoute: false });
  emitToUser(user._id, 'journey:end', payload);
  emitToAdmins('journey:end', { ...payload, user: { id: user._id.toString(), name: user.name } });
  await notifyUser(user._id, {
    title: 'Trip completed',
    message: `Your journey to ${trip.destination.name} has ended. Live tracking is now off.`,
    type: 'TRIP_UPDATE',
    data: { tripId: trip._id.toString() },
  });
  return serializeTrip(trip);
};

/** Creates an alert + notification unless an equivalent one was sent within the cooldown window. */
const raiseAlert = async ({ user, trip, type, severity, title, message, lat, lng, riskZoneId, cooldownMs, notificationType, event }) => {
  const since = new Date(Date.now() - cooldownMs);
  const duplicate = await Alert.findOne({
    userId: user._id,
    tripId: trip._id,
    type,
    severity,
    riskZoneId: riskZoneId || null,
    createdAt: { $gte: since },
  }).lean();
  if (duplicate) return null;

  const alert = await Alert.create({
    userId: user._id,
    tripId: trip._id,
    type,
    severity,
    title,
    message,
    latitude: lat,
    longitude: lng,
    riskZoneId,
  });
  const serialized = serializeAlert(alert);
  emitToUser(user._id, event, serialized);
  emitToAdmins(event, { ...serialized, user: { id: user._id.toString(), name: user.name } });
  await notifyUser(user._id, {
    title,
    message,
    type: notificationType,
    severity,
    data: { alertId: serialized.id, tripId: trip._id.toString(), riskZoneId: riskZoneId?.toString() },
  });
  return serialized;
};

const severityForAssessment = (assessment) => {
  const { riskLevel, inside } = assessment;
  if (riskLevel === 'HIGH') return inside ? 'HIGH' : 'MEDIUM';
  if (riskLevel === 'MEDIUM') return inside ? 'MEDIUM' : 'LOW';
  return 'LOW';
};

/**
 * Handles one location update from an active journey:
 * stores it (throttled), checks risk zones and route deviation, raises alerts.
 */
export const processLocation = async (user, { tripId, latitude, longitude, accuracy, speed, heading, timestamp }) => {
  const trip = await loadOwnedTrip(user._id, tripId);
  if (trip.status !== 'active') throw badRequest('Live tracking is only available during an active journey.');

  const now = timestamp ? new Date(timestamp) : new Date();
  const state = getState(trip._id.toString());
  const point = { lat: latitude, lng: longitude };

  // Throttle persistence: store at most every N seconds unless the user moved M metres.
  const shouldStore =
    !state.lastStored ||
    now - state.lastStored.time >= env.tracking.minStoreIntervalMs ||
    distanceMeters(state.lastStored.point, point) >= env.tracking.minStoreDistanceMeters;
  if (shouldStore) {
    await LocationPoint.create({
      userId: user._id,
      tripId: trip._id,
      latitude,
      longitude,
      accuracy,
      speed: speed ?? undefined,
      heading: heading ?? undefined,
      timestamp: now,
    });
    state.lastStored = { point, time: now };
  }

  // Weather check every 10 minutes during the journey.
  let weather = null;
  let freshWeather = false;
  if (Date.now() - state.lastWeatherCheck >= WEATHER_CHECK_INTERVAL_MS) {
    state.lastWeatherCheck = Date.now();
    try {
      weather = await getWeather(point);
      state.weather = weather;
      freshWeather = true;
    } catch {
      weather = null;
    }
  } else {
    weather = state.weather || null;
  }
  const isNight = resolveIsNight(weather);

  // Risk zones.
  const assessment = await assessLocation({ lat: latitude, lng: longitude, isNight, nearbyMeters: env.tracking.nearbyZoneMeters });
  const alerts = [];
  if (assessment.zone && (assessment.inside || assessment.riskLevel !== 'LOW')) {
    const severity = severityForAssessment(assessment);
    const zone = assessment.zone;
    const title = assessment.inside
      ? `${zone.riskLevel === 'HIGH' ? 'High' : zone.riskLevel === 'MEDIUM' ? 'Medium' : 'Low'}-risk area detected`
      : `${zone.riskLevel === 'HIGH' ? 'High' : 'Medium'}-risk zone ahead`;
    const zoneLabel = `${zone.name}${zone.isDemo ? ' (DEMO data)' : ''}`;
    const advice =
      zone.riskLevel === 'HIGH' ? 'Please consider an alternative route.' : zone.riskLevel === 'MEDIUM' ? 'Stay alert.' : 'Stay aware of your surroundings.';
    const message = assessment.inside ? `You are inside ${zoneLabel}. ${advice}` : `${zoneLabel} is ${zone.distanceText}. ${advice}`;
    const alert = await raiseAlert({
      user,
      trip,
      type: 'RISK_ZONE',
      severity,
      title,
      message,
      lat: latitude,
      lng: longitude,
      riskZoneId: zone.id,
      cooldownMs: env.tracking.alertCooldownMs,
      notificationType: 'RISK_ALERT',
      event: 'journey:risk-alert',
    });
    if (alert) alerts.push(alert);
  }

  // Route deviation (ignored when GPS accuracy is too poor to judge).
  let deviation = null;
  let progress = null;
  const routeGeometry = trip.selectedRoute?.geometry;
  if (routeGeometry?.coordinates?.length >= 2) {
    const offRouteMeters = distanceToRouteMeters(latitude, longitude, routeGeometry);
    const reliable = !Number.isFinite(accuracy) || accuracy <= MAX_ACCURACY_FOR_DEVIATION;
    deviation = { distance: Math.round(offRouteMeters), offRoute: reliable && offRouteMeters > env.tracking.routeDeviationMeters };
    progress = progressAlongRoute(latitude, longitude, routeGeometry);

    if (deviation.offRoute) {
      const alert = await raiseAlert({
        user,
        trip,
        type: 'ROUTE_DEVIATION',
        severity: 'MEDIUM',
        title: 'Route deviation detected',
        message: `You are about ${formatDistance(offRouteMeters)} away from your planned route.`,
        lat: latitude,
        lng: longitude,
        cooldownMs: env.tracking.alertCooldownMs,
        notificationType: 'TRIP_UPDATE',
        event: 'journey:route-deviation',
      });
      if (alert) alerts.push(alert);
    }
  }

  // Weather warning (only on fresh checks, with a long cooldown).
  if (freshWeather && weatherCodeSeverity(weather.current?.weatherCode) >= 2) {
    const alert = await raiseAlert({
      user,
      trip,
      type: 'WEATHER',
      severity: weatherCodeSeverity(weather.current.weatherCode) >= 3 ? 'HIGH' : 'MEDIUM',
      title: 'Weather warning',
      message: `${weather.current.condition} reported near your location. Drive carefully.`,
      lat: latitude,
      lng: longitude,
      cooldownMs: WEATHER_ALERT_COOLDOWN_MS,
      notificationType: 'WEATHER_ALERT',
      event: 'journey:notification',
    });
    if (alert) alerts.push(alert);
  }

  const status = {
    tripId: trip._id.toString(),
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    speed: speed ?? null,
    heading: heading ?? null,
    timestamp: now.toISOString(),
    risk: {
      riskLevel: assessment.riskLevel,
      inside: assessment.inside,
      distance: assessment.distance,
      message: assessment.message,
      zone: assessment.zone
        ? { id: assessment.zone.id, name: assessment.zone.name, riskLevel: assessment.zone.riskLevel, isDemo: assessment.zone.isDemo }
        : null,
    },
    deviation,
    progress: progress
      ? { travelled: Math.round(progress.travelled), remaining: Math.round(progress.remaining), total: Math.round(progress.total) }
      : null,
    weather: weather?.current
      ? { temperature: weather.current.temperature, condition: weather.current.condition, icon: weather.current.icon }
      : null,
    alerts,
  };

  // Admins see live positions of active journeys; other users never do.
  emitToAdmins('journey:location', {
    tripId: status.tripId,
    user: { id: user._id.toString(), name: user.name },
    latitude,
    longitude,
    riskLevel: assessment.riskLevel,
    timestamp: status.timestamp,
  });
  return status;
};

export const getTripTrack = async (user, tripId) => {
  const trip = await Trip.findById(tripId).lean();
  if (!trip) throw notFound('Trip not found');
  if (trip.userId.toString() !== user._id.toString() && user.role !== 'admin') throw notFound('Trip not found');

  const points = await LocationPoint.find({ tripId }).sort({ timestamp: 1 }).select('-__v -userId').lean();
  return {
    tripId,
    status: trip.status,
    points: points.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy ?? null,
      speed: p.speed ?? null,
      heading: p.heading ?? null,
      timestamp: p.timestamp,
    })),
  };
};
