import RiskZone from '../models/RiskZone.js';
import {
  boxAroundGeometry,
  boxAroundPoint,
  distanceToZoneMeters,
  formatDistance,
  routeDistanceToZoneMeters,
} from '../utils/geoUtils.js';
import { weatherCodeSeverity } from './weatherService.js';

const LEVEL_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const LEVEL_WEIGHT = { LOW: 5, MEDIUM: 15, HIGH: 30 };
const ROUTE_NEARBY_METERS = 1000;

export const DISCLAIMER = 'Lower risk based on available data. This is not a guarantee of safety.';

export const maxLevel = (a, b) => ((LEVEL_RANK[a] || 0) >= (LEVEL_RANK[b] || 0) ? a : b);

/** Whether a zone applies at the given time of day. */
const appliesNow = (zone, isNight) =>
  zone.activeHours === 'ALWAYS' || (zone.activeHours === 'NIGHT' ? isNight : !isNight);

/** Night if the weather API says so, otherwise fall back to 19:00–06:00 local server time. */
export const resolveIsNight = (weather, date = new Date()) => {
  if (typeof weather?.current?.isDay === 'boolean' && Math.abs(Date.now() - date.getTime()) < 60 * 60 * 1000) {
    return !weather.current.isDay;
  }
  const offset = weather?.location?.utcOffsetSeconds;
  const hour = Number.isFinite(offset) ? new Date(date.getTime() + offset * 1000).getUTCHours() : date.getHours();
  return hour >= 19 || hour < 6;
};

const zoneSummary = (zone, distance, extra = {}) => ({
  id: zone._id.toString(),
  name: zone.name,
  description: zone.description,
  riskLevel: zone.riskLevel,
  sourceType: zone.sourceType,
  sourceName: zone.sourceName,
  confidence: zone.confidence,
  activeHours: zone.activeHours,
  isDemo: zone.sourceType === 'DEMO',
  center: zone.center,
  geometry: zone.geometry,
  updatedAt: zone.updatedAt,
  distance: Math.round(distance),
  distanceText: distance === 0 ? 'You are inside' : `${formatDistance(distance)} away`,
  ...extra,
});

/**
 * Active risk zones within `radius` metres of a point, nearest first.
 * Uses a 2dsphere query as a coarse filter, then exact Turf.js distances.
 */
export const findZonesNear = async ({ lat, lng, radius = 5000, isNight = false, includeAllHours = false }) => {
  const zones = await RiskZone.find({
    ...RiskZone.activeFilter(),
    geometry: { $geoIntersects: { $geometry: boxAroundPoint(lat, lng, radius) } },
  }).lean({ virtuals: false });

  return zones
    .filter((zone) => includeAllHours || appliesNow(zone, isNight))
    .map((zone) => ({ zone, distance: distanceToZoneMeters(lat, lng, zone.geometry) }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance || LEVEL_RANK[b.zone.riskLevel] - LEVEL_RANK[a.zone.riskLevel])
    .map(({ zone, distance }) => zoneSummary(zone, distance));
};

/**
 * Point risk assessment used by live tracking and safety checks.
 * Returns { riskLevel, zone, distance, inside, message, nearby }.
 */
export const assessLocation = async ({ lat, lng, isNight = false, nearbyMeters = 500 }) => {
  const nearby = await findZonesNear({ lat, lng, radius: Math.max(nearbyMeters, 2000), isNight });
  const inside = nearby.filter((z) => z.distance === 0);
  const close = nearby.filter((z) => z.distance > 0 && z.distance <= nearbyMeters);

  const pickWorst = (list) =>
    list.reduce((worst, z) => (!worst || LEVEL_RANK[z.riskLevel] > LEVEL_RANK[worst.riskLevel] ? z : worst), null);

  const insideZone = pickWorst(inside);
  if (insideZone) {
    const msg =
      insideZone.riskLevel === 'HIGH'
        ? 'High-risk area detected. Please consider an alternative route.'
        : insideZone.riskLevel === 'MEDIUM'
          ? 'You are in a medium-risk area. Stay alert.'
          : 'You are in a low-risk advisory area.';
    return { riskLevel: insideZone.riskLevel, zone: insideZone, distance: 0, inside: true, message: msg, nearby };
  }

  const nearZone = pickWorst(close);
  if (nearZone) {
    return {
      riskLevel: nearZone.riskLevel,
      zone: nearZone,
      distance: nearZone.distance,
      inside: false,
      message: `${nearZone.riskLevel === 'HIGH' ? 'High' : nearZone.riskLevel === 'MEDIUM' ? 'Medium' : 'Low'}-risk zone ${nearZone.distanceText}.`,
      nearby,
    };
  }

  return {
    riskLevel: 'LOW',
    zone: null,
    distance: nearby[0]?.distance ?? null,
    inside: false,
    message: 'No mapped risk zones nearby. ' + DISCLAIMER,
    nearby,
  };
};

/** Active zones within 1 km of a route LineString, flagged when the route passes through them. */
export const zonesAlongRoute = async (geometry, isNight = false) => {
  const zones = await RiskZone.find({
    ...RiskZone.activeFilter(),
    geometry: { $geoIntersects: { $geometry: boxAroundGeometry(geometry, ROUTE_NEARBY_METERS) } },
  }).lean();

  return zones
    .filter((zone) => appliesNow(zone, isNight))
    .map((zone) => {
      const distance = routeDistanceToZoneMeters(geometry, zone.geometry);
      return zoneSummary(zone, distance, { intersects: distance === 0 });
    })
    .filter((z) => z.distance <= ROUTE_NEARBY_METERS)
    .sort((a, b) => a.distance - b.distance);
};

// ---------------------------------------------------------------------------
// Explainable safety scoring
// ---------------------------------------------------------------------------
const zonePenalty = (zone) => {
  const confidenceFactor = 0.5 + 0.5 * (zone.confidence ?? 0.5);
  const base = LEVEL_WEIGHT[zone.riskLevel] * confidenceFactor;
  if (zone.distance === 0) return base;
  // Nearby zones count less the farther away they are.
  return base * 0.4 * Math.max(0, 1 - zone.distance / 2000);
};

const weatherFactors = (weather) => {
  const factors = [];
  const c = weather?.current;
  if (!c) {
    factors.push({ label: 'Weather data unavailable', impact: 0, kind: 'neutral' });
    return factors;
  }
  const severity = weatherCodeSeverity(c.weatherCode);
  if (severity === 3) factors.push({ label: `Severe weather: ${c.condition}`, impact: -20, kind: 'negative' });
  else if (severity === 2) factors.push({ label: `Adverse weather: ${c.condition}`, impact: -10, kind: 'negative' });
  else if (severity === 1) factors.push({ label: `Light precipitation: ${c.condition}`, impact: -4, kind: 'negative' });
  else factors.push({ label: `Good weather (${c.condition})`, impact: 0, kind: 'positive' });

  if (Number.isFinite(c.visibility) && c.visibility < 1000) {
    factors.push({ label: `Low visibility (${Math.round(c.visibility)} m)`, impact: -6, kind: 'negative' });
  }
  if (Number.isFinite(c.windSpeed) && c.windSpeed >= 50) {
    factors.push({ label: `Strong winds (${Math.round(c.windSpeed)} km/h)`, impact: -6, kind: 'negative' });
  }
  return factors;
};

const zoneFactors = (zones, contextLabel) => {
  const relevant = zones.filter((z) => zonePenalty(z) > 0.5);
  if (!relevant.length) return [{ label: `No mapped risk zones ${contextLabel}`, impact: 0, kind: 'positive' }];

  let total = 0;
  const factors = relevant.slice(0, 5).map((z) => {
    const impact = -Math.round(zonePenalty(z));
    total += impact;
    const where = z.distance === 0 ? (contextLabel === 'along route' ? 'route passes through' : 'inside') : z.distanceText;
    return {
      label: `${z.riskLevel} risk zone: ${z.name} (${where})${z.isDemo ? ' [DEMO data]' : ''}`,
      impact,
      kind: 'negative',
    };
  });
  // Cap the total zone penalty so one dense area cannot drive the score below zero on its own.
  if (total < -60) {
    const scale = -60 / total;
    factors.forEach((f) => {
      f.impact = Math.round(f.impact * scale);
    });
  }
  return factors;
};

export const levelFromScore = (score) => (score >= 75 ? 'LOW' : score >= 50 ? 'MEDIUM' : 'HIGH');
export const statusFromScore = (score) =>
  score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Moderate' : 'High Risk';

const finalize = (factors) => {
  const score = Math.max(0, Math.min(100, Math.round(100 + factors.reduce((sum, f) => sum + (f.impact || 0), 0))));
  return { score, riskLevel: levelFromScore(score), status: statusFromScore(score), factors };
};

/** Scores a route using zones along it, weather, time of day and journey length. */
export const scoreRoute = ({ route, zones, weather, isNight }) => {
  const factors = [...zoneFactors(zones, 'along route'), ...weatherFactors(weather)];
  factors.push(
    isNight
      ? { label: 'Night-time travel', impact: -10, kind: 'negative' }
      : { label: 'Daytime travel', impact: 0, kind: 'positive' }
  );
  const km = route.distance / 1000;
  if (km > 600) factors.push({ label: `Very long journey (${Math.round(km)} km) — plan rest stops`, impact: -8, kind: 'negative' });
  else if (km > 300) factors.push({ label: `Long journey (${Math.round(km)} km) — plan rest stops`, impact: -4, kind: 'negative' });

  const result = finalize(factors);
  const through = zones.filter((z) => z.intersects);
  const highThrough = through.filter((z) => z.riskLevel === 'HIGH');

  let recommendation;
  if (highThrough.length) {
    recommendation = `This route passes through ${highThrough.length} high-risk zone${highThrough.length > 1 ? 's' : ''} (${highThrough
      .map((z) => z.name)
      .join(', ')}). Consider an alternative route.`;
  } else if (through.length) {
    recommendation = `This route passes through ${through.length} mapped risk zone${through.length > 1 ? 's' : ''}. Stay alert in those areas.`;
  } else if (zones.length) {
    recommendation = `No mapped risk zones on the route itself; ${zones.length} nearby. ${DISCLAIMER}`;
  } else {
    recommendation = `No mapped risk zones along this route. ${DISCLAIMER}`;
  }
  if (isNight) recommendation += ' Night-time travel adds risk; prefer well-lit main roads.';

  return { ...result, recommendation };
};

/** Scores the user's current area for the Safety Check screen. */
export const scoreLocation = ({ zones, weather, isNight, activeAlerts = [] }) => {
  const factors = [...zoneFactors(zones, 'nearby'), ...weatherFactors(weather)];
  factors.push(
    isNight
      ? { label: 'Night-time', impact: -8, kind: 'negative' }
      : { label: 'Daytime', impact: 0, kind: 'positive' }
  );
  if (activeAlerts.length) {
    factors.push({
      label: `${activeAlerts.length} active safety alert${activeAlerts.length > 1 ? 's' : ''} nearby`,
      impact: -Math.min(10, activeAlerts.length * 5),
      kind: 'negative',
    });
  } else {
    factors.push({ label: 'No active road or safety alerts', impact: 0, kind: 'positive' });
  }
  return finalize(factors);
};

/** Morning/afternoon/evening/night outlook for today based on hourly weather and zones. */
export const forecastSlots = ({ weather, zones }) => {
  const slots = [
    { id: 'morning', time: 'Morning', hours: [6, 7, 8, 9, 10, 11] },
    { id: 'afternoon', time: 'Afternoon', hours: [12, 13, 14, 15, 16] },
    { id: 'evening', time: 'Evening', hours: [17, 18, 19, 20] },
    { id: 'night', time: 'Night', hours: [21, 22, 23, 0, 1, 2, 3, 4, 5] },
  ];
  const hourly = weather?.todayHourly || [];

  return slots.map((slot) => {
    const rows = hourly.filter((r) => slot.hours.includes(r.hour));
    const worstCode = rows.reduce((worst, r) => Math.max(worst, weatherCodeSeverity(r.weatherCode)), 0);
    const nightRows = rows.filter((r) => !r.isDay).length;
    const isNight = rows.length ? nightRows > rows.length / 2 : slot.id === 'night';
    const slotWeather = rows.length
      ? {
          current: {
            weatherCode: rows.find((r) => weatherCodeSeverity(r.weatherCode) === worstCode)?.weatherCode,
            visibility: Math.min(...rows.map((r) => r.visibility ?? Infinity)),
            windSpeed: Math.max(...rows.map((r) => r.windSpeed ?? 0)),
            condition: '',
          },
        }
      : null;
    const relevantZones = zones.filter((z) => appliesNow(z, isNight));
    const { score, status } = scoreLocation({ zones: relevantZones, weather: slotWeather, isNight });
    return { id: slot.id, time: slot.time, score, status };
  });
};
