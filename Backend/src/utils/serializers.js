import { formatDistance, formatDuration } from './geoUtils.js';

export const serializeTrip = (trip, { includeRoute = true } = {}) => {
  const t = trip.toObject ? trip.toObject() : trip;
  const route = t.selectedRoute;
  return {
    id: t._id.toString(),
    userId: t.userId?._id ? t.userId._id.toString() : t.userId?.toString(),
    user: t.userId?.name ? { id: t.userId._id.toString(), name: t.userId.name, email: t.userId.email, phone: t.userId.phone } : undefined,
    from: t.from,
    destination: t.destination,
    travelDate: t.travelDate,
    travelers: t.travelers,
    travelMode: t.travelMode,
    routePreference: t.routePreference,
    distance: t.distance ?? null,
    duration: t.duration ?? null,
    distanceText: formatDistance(t.distance),
    durationText: formatDuration(t.duration),
    safetyScore: t.safetyScore ?? null,
    riskLevel: route?.riskLevel ?? null,
    weatherSummary: t.weatherSummary ?? null,
    status: t.status,
    startedAt: t.startedAt ?? null,
    endedAt: t.endedAt ?? null,
    summary: t.summary ?? null,
    isDemo: Boolean(t.isDemo),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    selectedRoute: route
      ? {
          summary: route.summary,
          distance: route.distance,
          duration: route.duration,
          safetyScore: route.safetyScore,
          riskLevel: route.riskLevel,
          factors: route.factors || [],
          recommendation: route.recommendation,
          riskZoneIds: (route.riskZoneIds || []).map(String),
          profile: route.profile,
          ...(includeRoute ? { geometry: route.geometry, steps: route.steps || [] } : {}),
        }
      : null,
  };
};

export const serializeAlert = (a) => {
  const alert = a.toObject ? a.toObject() : a;
  return {
    id: alert._id.toString(),
    userId: alert.userId?._id ? alert.userId._id.toString() : alert.userId?.toString(),
    user: alert.userId?.name ? { id: alert.userId._id.toString(), name: alert.userId.name, email: alert.userId.email, phone: alert.userId.phone } : undefined,
    tripId: alert.tripId?.toString() ?? null,
    type: alert.type,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
    latitude: alert.latitude ?? null,
    longitude: alert.longitude ?? null,
    riskZoneId: alert.riskZoneId?._id ? alert.riskZoneId._id.toString() : alert.riskZoneId?.toString() ?? null,
    riskZone: alert.riskZoneId?.name ? { id: alert.riskZoneId._id.toString(), name: alert.riskZoneId.name, riskLevel: alert.riskZoneId.riskLevel } : undefined,
    status: alert.status,
    meta: alert.meta ?? null,
    read: alert.read,
    isDemo: Boolean(alert.isDemo),
    createdAt: alert.createdAt,
    resolvedAt: alert.resolvedAt ?? null,
  };
};
