import { getDirections } from './mapService.js';
import { getWeather, summarizeWeather } from './weatherService.js';
import { DISCLAIMER, resolveIsNight, scoreRoute, zonesAlongRoute } from './riskService.js';
import { formatDistance, formatDuration, simplifyLine } from '../utils/geoUtils.js';

const safeWeather = async (point) => {
  try {
    return await getWeather(point);
  } catch {
    return null;
  }
};

/** Scores one route (geometry + distance + duration) against zones and weather. */
export const scoreSingleRoute = async ({ route, originWeather, destinationWeather, departureTime }) => {
  const isNight = resolveIsNight(originWeather, departureTime ? new Date(departureTime) : new Date());
  const zones = await zonesAlongRoute(route.geometry, isNight);
  // Use the worse of origin/destination weather for scoring.
  const weather =
    (destinationWeather?.current?.weatherCode ?? -1) > (originWeather?.current?.weatherCode ?? -1)
      ? destinationWeather
      : originWeather;
  const scored = scoreRoute({ route, zones, weather, isNight });
  return { zones, isNight, ...scored };
};

const sortByPreference = (routes, preference) => {
  const byScore = (a, b) => b.safetyScore - a.safetyScore || a.duration - b.duration;
  switch (preference) {
    case 'fastest':
      return [...routes].sort((a, b) => a.duration - b.duration);
    case 'shortest':
      return [...routes].sort((a, b) => a.distance - b.distance);
    case 'avoid-risk': {
      const clear = routes.filter((r) => !r.zones.some((z) => z.intersects && z.riskLevel === 'HIGH'));
      const rest = routes.filter((r) => !clear.includes(r));
      return [...clear.sort(byScore), ...rest.sort(byScore)];
    }
    case 'safest':
    case 'avoid-tolls':
    default:
      return [...routes].sort(byScore);
  }
};

/**
 * Full Plan Trip analysis: routes from Mapbox, risk zones along each route,
 * weather at both ends, safety score per route, ordered by preference.
 */
export const analyzeRoutes = async ({ from, destination, travelMode, routePreference, departureTime, steps = true }) => {
  const [rawRoutes, originWeather, destinationWeather] = await Promise.all([
    getDirections({ from, destination, travelMode, avoidTolls: routePreference === 'avoid-tolls', steps }),
    safeWeather({ lat: from.latitude, lng: from.longitude }),
    safeWeather({ lat: destination.latitude, lng: destination.longitude }),
  ]);

  const analysed = await Promise.all(
    rawRoutes.map(async (route) => {
      const geometry = simplifyLine(route.geometry);
      const scored = await scoreSingleRoute({ route: { ...route, geometry }, originWeather, destinationWeather, departureTime });
      return {
        id: `route-${route.index}`,
        summary: route.summary,
        profile: route.profile,
        geometry,
        distance: route.distance,
        duration: route.duration,
        distanceText: formatDistance(route.distance),
        durationText: formatDuration(route.duration),
        steps: route.steps,
        safetyScore: scored.score,
        riskLevel: scored.riskLevel,
        status: scored.status,
        factors: scored.factors,
        recommendation: scored.recommendation,
        isNight: scored.isNight,
        zones: scored.zones.map(({ geometry: _g, ...z }) => z),
      };
    })
  );

  const ordered = sortByPreference(analysed, routePreference);
  ordered.forEach((route, i) => {
    route.recommended = i === 0;
  });

  return {
    routes: ordered,
    recommendedRouteId: ordered[0]?.id,
    weather: {
      origin: originWeather ? { summary: summarizeWeather(originWeather), current: originWeather.current } : null,
      destination: destinationWeather ? { summary: summarizeWeather(destinationWeather), current: destinationWeather.current, daily: destinationWeather.daily } : null,
    },
    disclaimer: DISCLAIMER,
    note:
      travelMode === 'train'
        ? 'Rail routing is not available; the road route is shown as an approximation.'
        : null,
  };
};
