import * as turf from '@turf/turf';

export const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

export const parseLatLng = (latValue, lngValue) => {
  const lat = Number(latValue);
  const lng = Number(lngValue);
  return isValidLatLng(lat, lng) ? { lat, lng } : null;
};

/** Great-circle distance in metres. */
export const distanceMeters = (a, b) =>
  turf.distance(turf.point([a.lng, a.lat]), turf.point([b.lng, b.lat]), { units: 'meters' });

/** Builds a GeoJSON polygon approximating a circle around a point. */
export const circlePolygon = (lat, lng, radiusMeters, steps = 48) =>
  turf.circle([lng, lat], radiusMeters / 1000, { steps, units: 'kilometers' }).geometry;

/** Bounding-box polygon around a point, used for coarse geospatial pre-filtering. */
export const boxAroundPoint = (lat, lng, radiusMeters) => {
  const buffered = turf.buffer(turf.point([lng, lat]), radiusMeters / 1000, { units: 'kilometers' });
  return turf.bboxPolygon(turf.bbox(buffered)).geometry;
};

/** Bounding-box polygon around any GeoJSON geometry plus a margin. */
export const boxAroundGeometry = (geometry, marginMeters) => {
  const [minX, minY, maxX, maxY] = turf.bbox(geometry);
  const latPad = marginMeters / 111320;
  const midLat = (minY + maxY) / 2;
  const lngPad = marginMeters / (111320 * Math.max(Math.cos((midLat * Math.PI) / 180), 0.01));
  return turf.bboxPolygon([minX - lngPad, minY - latPad, maxX + lngPad, maxY + latPad]).geometry;
};

/**
 * Distance in metres from a point to a polygon/multipolygon zone.
 * Returns 0 when the point is inside.
 */
export const distanceToZoneMeters = (lat, lng, geometry) => {
  const pt = turf.point([lng, lat]);
  if (turf.booleanPointInPolygon(pt, geometry)) return 0;
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  let min = Infinity;
  polygons.forEach((rings) => {
    rings.forEach((ring) => {
      const d = turf.pointToLineDistance(pt, turf.lineString(ring), { units: 'meters' });
      if (d < min) min = d;
    });
  });
  return min;
};

/** Distance in metres from a point to a LineString route. */
export const distanceToRouteMeters = (lat, lng, lineGeometry) =>
  turf.pointToLineDistance(turf.point([lng, lat]), turf.lineString(lineGeometry.coordinates), { units: 'meters' });

/** Whether a route LineString passes through a zone polygon. */
export const routeIntersectsZone = (lineGeometry, zoneGeometry) =>
  turf.booleanIntersects(turf.lineString(lineGeometry.coordinates), turf.feature(zoneGeometry));

/** Minimum distance in metres between a route and a zone (0 when they intersect). */
export const routeDistanceToZoneMeters = (lineGeometry, zoneGeometry) => {
  if (routeIntersectsZone(lineGeometry, zoneGeometry)) return 0;
  const line = turf.lineString(lineGeometry.coordinates);
  const center = turf.centroid(turf.feature(zoneGeometry));
  const nearest = turf.nearestPointOnLine(line, center, { units: 'meters' });
  const [lng, lat] = nearest.geometry.coordinates;
  return distanceToZoneMeters(lat, lng, zoneGeometry);
};

/** Simplifies a route geometry to keep stored documents small (~10 m tolerance). */
export const simplifyLine = (lineGeometry, tolerance = 0.0001) =>
  turf.simplify(turf.lineString(lineGeometry.coordinates), { tolerance, highQuality: false }).geometry;

/**
 * Progress of a point along a route: distance travelled and remaining, in metres.
 */
export const progressAlongRoute = (lat, lng, lineGeometry) => {
  const line = turf.lineString(lineGeometry.coordinates);
  const total = turf.length(line, { units: 'meters' });
  const snapped = turf.nearestPointOnLine(line, turf.point([lng, lat]), { units: 'meters' });
  const travelled = snapped.properties.location ?? 0;
  return { total, travelled, remaining: Math.max(total - travelled, 0) };
};

export const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) return null;
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
};

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return null;
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};
