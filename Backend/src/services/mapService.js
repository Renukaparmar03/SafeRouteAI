import { env } from '../config/env.js';
import { ApiError } from '../utils/responseUtils.js';
import { createCache, fetchJson } from '../utils/cache.js';
import { distanceMeters, formatDistance } from '../utils/geoUtils.js';

/*
 * Map data providers.
 * Default (no key needed): OpenStreetMap-based services
 *   - Photon (komoot) for place search / reverse geocoding
 *   - OSRM (routing.openstreetmap.de) for routes
 *   - Overpass for nearby emergency services
 * If MAPBOX_ACCESS_TOKEN is set, Mapbox is used for search, routes and places instead.
 */
const MAPBOX = 'https://api.mapbox.com';
const nearbyCache = createCache(15 * 60 * 1000);
const searchCache = createCache(10 * 60 * 1000);
const USER_AGENT = 'SafeRouteAI/1.0 (travel safety app)';

export const mapProvider = () => (env.mapboxToken ? 'mapbox' : 'osm');

const upstream = async (url, service) => {
  try {
    return await fetchJson(url, { service, headers: { 'User-Agent': USER_AGENT } });
  } catch (error) {
    throw new ApiError(error.statusCode || 502, `${error.message}. Please try again.`);
  }
};

// ---------------------------------------------------------------------------
// Place search / reverse geocoding
// ---------------------------------------------------------------------------
const mapboxToPlace = (feature) => {
  const p = feature.properties || {};
  const coords = p.coordinates || {};
  return {
    id: p.mapbox_id || feature.id,
    name: p.name_preferred || p.name,
    fullAddress: p.full_address || [p.name, p.place_formatted].filter(Boolean).join(', '),
    placeType: p.feature_type,
    latitude: coords.latitude ?? feature.geometry?.coordinates?.[1],
    longitude: coords.longitude ?? feature.geometry?.coordinates?.[0],
  };
};

const photonToPlace = (feature) => {
  const p = feature.properties || {};
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const parts = [p.name, street, p.locality, p.district, p.city, p.state, p.country].filter(Boolean);
  const unique = parts.filter((part, i) => parts.indexOf(part) === i);
  return {
    id: `osm-${p.osm_type}-${p.osm_id}`,
    name: p.name || street || p.city || unique[0],
    fullAddress: unique.join(', '),
    placeType: p.type || p.osm_value,
    city: p.city || p.county,
    state: p.state,
    latitude: feature.geometry?.coordinates?.[1],
    longitude: feature.geometry?.coordinates?.[0],
  };
};

/** Forward geocoding / place search. */
export const searchPlaces = async ({ q, lat, lng, limit = 5 }) => {
  const provider = mapProvider();
  const key = `${provider}|${q.toLowerCase()}|${lat?.toFixed(2)}|${lng?.toFixed(2)}|${limit}`;
  const cached = searchCache.get(key);
  if (cached) return cached;
  const hasBias = Number.isFinite(lat) && Number.isFinite(lng);

  let places;
  if (provider === 'mapbox') {
    const params = new URLSearchParams({ q, limit: String(limit), autocomplete: 'true', access_token: env.mapboxToken });
    if (hasBias) params.set('proximity', `${lng},${lat}`);
    const data = await upstream(`${MAPBOX}/search/geocode/v6/forward?${params}`, 'Mapbox Geocoding');
    places = (data.features || []).map(mapboxToPlace);
  } else {
    const params = new URLSearchParams({ q, limit: String(limit), lang: 'en' });
    if (hasBias) {
      params.set('lat', String(lat));
      params.set('lon', String(lng));
    }
    const data = await upstream(`${env.photonUrl}/api/?${params}`, 'Place search (Photon/OpenStreetMap)');
    places = (data.features || []).map(photonToPlace);
  }
  return searchCache.set(key, places.filter((p) => Number.isFinite(p.latitude) && p.name));
};

export const reverseGeocode = async ({ lat, lng }) => {
  const provider = mapProvider();
  const key = `rev|${provider}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  if (provider === 'mapbox') {
    const params = new URLSearchParams({ longitude: String(lng), latitude: String(lat), limit: '1', access_token: env.mapboxToken });
    const data = await upstream(`${MAPBOX}/search/geocode/v6/reverse?${params}`, 'Mapbox Geocoding');
    const feature = data.features?.[0];
    if (!feature) return null;
    const place = mapboxToPlace(feature);
    const ctx = feature.properties?.context || {};
    const shortName = [ctx.locality?.name || ctx.place?.name, ctx.region?.name || ctx.country?.name].filter(Boolean).join(', ');
    return searchCache.set(key, { ...place, shortName: shortName || place.name, latitude: lat, longitude: lng });
  }

  // Prefer streets/localities over random nearby POIs (e.g. a shop) for a readable address.
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), limit: '1', lang: 'en' });
  ['street', 'locality', 'district'].forEach((layer) => params.append('layer', layer));
  const data = await upstream(`${env.photonUrl}/reverse?${params}`, 'Reverse geocoding (Photon/OpenStreetMap)');
  const feature = data.features?.[0];
  if (!feature) return null;
  const place = photonToPlace(feature);
  const p = feature.properties || {};
  const shortName = [p.locality || p.district || p.city, p.city && (p.locality || p.district) ? p.city : p.state].filter(Boolean).join(', ');
  return searchCache.set(key, { ...place, shortName: shortName || place.name, latitude: lat, longitude: lng });
};

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------
/** Travel mode → Mapbox profile / OSRM profile. Bikes are two-wheelers on the road network. */
export const PROFILE_BY_MODE = {
  car: 'driving-traffic',
  bike: 'driving',
  bus: 'driving',
  train: 'driving', // No rail/transit routing: the road route is shown as an approximation.
  walk: 'walking',
};
const OSRM_PROFILE_BY_MODE = { car: 'car', bike: 'car', bus: 'car', train: 'car', walk: 'foot' };

const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;

/** OSRM returns maneuvers without text; build a readable instruction. */
export const osrmInstruction = ({ maneuver = {}, name, rotary_name: rotaryName }) => {
  const { type, modifier, exit } = maneuver;
  const onto = name ? ` onto ${name}` : '';
  const dir = modifier && modifier !== 'straight' ? modifier : null;
  switch (type) {
    case 'depart':
      return `Start${name ? ` on ${name}` : ''}`;
    case 'arrive':
      return 'Arrive at your destination';
    case 'turn':
      if (modifier === 'uturn') return `Make a U-turn${onto}`;
      return dir ? `Turn ${dir}${onto}` : `Continue straight${onto}`;
    case 'new name':
      return `Continue${onto}`;
    case 'continue':
      return dir ? `Keep ${dir}${onto}` : `Continue straight${onto}`;
    case 'merge':
      return `Merge${dir ? ` ${dir}` : ''}${onto}`;
    case 'on ramp':
      return `Take the ramp${dir ? ` on the ${dir}` : ''}${onto}`;
    case 'off ramp':
      return `Take the exit${dir ? ` on the ${dir}` : ''}${onto}`;
    case 'fork':
      return `Keep ${dir || 'straight'} at the fork${onto}`;
    case 'end of road':
      return `Turn ${dir || 'ahead'} at the end of the road${onto}`;
    case 'roundabout':
    case 'rotary':
      return `At the ${rotaryName || 'roundabout'}, take the ${exit ? ordinal(exit) : 'next'} exit${onto}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `Exit the roundabout${onto}`;
    case 'roundabout turn':
      return `At the roundabout, turn ${dir || 'ahead'}${onto}`;
    default:
      return dir ? `Go ${dir}${onto}` : `Continue${onto}`;
  }
};

const normaliseRoutes = (routes, profile, steps, instructionFor) =>
  routes.map((route, index) => ({
    index,
    profile,
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    summary: route.legs?.map((leg) => leg.summary).filter(Boolean).join(' • ') || `Route ${index + 1}`,
    steps: steps
      ? route.legs.flatMap((leg) =>
          leg.steps.map((s) => ({
            instruction: instructionFor(s),
            distance: s.distance,
            duration: s.duration,
            name: s.name,
            maneuver: { type: s.maneuver?.type, modifier: s.maneuver?.modifier, location: s.maneuver?.location },
          }))
        )
      : [],
  }));

/**
 * Calculates routes (with alternatives). Returns GeoJSON geometry, metres and seconds.
 * Uses Mapbox Directions when configured, otherwise OSRM on OpenStreetMap data.
 */
export const getDirections = async ({ from, destination, travelMode = 'car', avoidTolls = false, steps = true }) => {
  const coords = `${from.longitude},${from.latitude};${destination.longitude},${destination.latitude}`;
  let data;
  let profile;
  let instructionFor;

  if (mapProvider() === 'mapbox') {
    profile = PROFILE_BY_MODE[travelMode] || 'driving';
    const params = new URLSearchParams({
      alternatives: 'true',
      geometries: 'geojson',
      overview: 'full',
      steps: steps ? 'true' : 'false',
      access_token: env.mapboxToken,
    });
    if (avoidTolls && profile.startsWith('driving')) params.set('exclude', 'toll');
    data = await upstream(`${MAPBOX}/directions/v5/mapbox/${profile}/${coords}?${params}`, 'Mapbox Directions');
    instructionFor = (s) => s.maneuver?.instruction;
  } else {
    // The public OSRM servers do not support toll exclusion; "avoid tolls" then ranks like "safest".
    profile = OSRM_PROFILE_BY_MODE[travelMode] || 'car';
    const params = new URLSearchParams({
      alternatives: 'true',
      geometries: 'geojson',
      overview: 'full',
      steps: steps ? 'true' : 'false',
    });
    data = await upstream(`${env.osrmUrl}/routed-${profile}/route/v1/driving/${coords}?${params}`, 'Routing (OSRM/OpenStreetMap)');
    instructionFor = osrmInstruction;
  }

  if (data.code && data.code !== 'Ok') {
    throw new ApiError(422, data.message || `No route found (${data.code})`);
  }
  if (!data.routes?.length) throw new ApiError(422, 'No route found between these places.');
  return normaliseRoutes(data.routes, profile, steps, instructionFor);
};

// ---------------------------------------------------------------------------
// Nearby emergency services: Mapbox Search Box category search, with
// OpenStreetMap Overpass as a fallback (and the only source when Mapbox is not configured).
// ---------------------------------------------------------------------------
export const SERVICE_CATEGORIES = {
  hospital: { label: 'Hospital', mapbox: 'hospital', osm: '["amenity"="hospital"]' },
  police: { label: 'Police Station', mapbox: 'police_station', osm: '["amenity"="police"]' },
  pharmacy: { label: 'Pharmacy', mapbox: 'pharmacy', osm: '["amenity"="pharmacy"]' },
  fuel: { label: 'Petrol Pump', mapbox: 'gas_station', osm: '["amenity"="fuel"]' },
};

const withDistance = (origin, places) =>
  places
    .map((p) => {
      const meters = distanceMeters(origin, { lat: p.latitude, lng: p.longitude });
      return { ...p, distance: Math.round(meters), distanceText: formatDistance(meters) };
    })
    .sort((a, b) => a.distance - b.distance);

const mapboxCategory = async (category, { lat, lng, limit }) => {
  const params = new URLSearchParams({ proximity: `${lng},${lat}`, limit: String(limit), access_token: env.mapboxToken });
  const data = await fetchJson(`${MAPBOX}/search/searchbox/v1/category/${SERVICE_CATEGORIES[category].mapbox}?${params}`, {
    service: 'Mapbox Search Box',
  });
  return (data.features || []).map((f) => ({
    id: f.properties?.mapbox_id,
    name: f.properties?.name,
    address: f.properties?.full_address || f.properties?.place_formatted || null,
    latitude: f.properties?.coordinates?.latitude ?? f.geometry?.coordinates?.[1],
    longitude: f.properties?.coordinates?.longitude ?? f.geometry?.coordinates?.[0],
    source: 'Mapbox',
  }));
};

const overpassCategory = async (category, { lat, lng, limit }) => {
  const filter = SERVICE_CATEGORIES[category].osm;
  const radius = 8000;
  const query = `[out:json][timeout:15];(node${filter}(around:${radius},${lat},${lng});way${filter}(around:${radius},${lat},${lng}););out center ${limit * 3};`;
  let data;
  let lastError;
  for (const url of env.overpassUrls) {
    try {
      data = await fetchJson(url, {
        service: 'OpenStreetMap Overpass',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
        body: new URLSearchParams({ data: query }).toString(),
        timeoutMs: 20000,
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!data) throw lastError;
  return (data.elements || [])
    .map((el) => {
      const t = el.tags || {};
      const address = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city']].filter(Boolean).join(', ');
      return {
        id: `osm-${el.type}-${el.id}`,
        name: t.name || t['name:en'] || SERVICE_CATEGORIES[category].label,
        address: address || null,
        phone: t.phone || t['contact:phone'] || null,
        latitude: el.lat ?? el.center?.lat,
        longitude: el.lon ?? el.center?.lon,
        source: 'OpenStreetMap',
      };
    })
    .filter((p) => Number.isFinite(p.latitude));
};

export const findNearbyServices = async ({ lat, lng, category = 'all', limit = 5 }) => {
  const categories = category === 'all' ? Object.keys(SERVICE_CATEGORIES) : [category];
  const key = `${lat.toFixed(3)}|${lng.toFixed(3)}|${category}|${limit}`;
  const cached = nearbyCache.get(key);
  if (cached) return cached;

  const results = {};
  const errors = [];
  await Promise.all(
    categories.map(async (cat) => {
      let places = [];
      if (env.mapboxToken) {
        try {
          places = await mapboxCategory(cat, { lat, lng, limit });
        } catch (error) {
          errors.push(error.message);
        }
      }
      if (!places.length) {
        try {
          places = await overpassCategory(cat, { lat, lng, limit });
        } catch (error) {
          errors.push(error.message);
        }
      }
      results[cat] = withDistance({ lat, lng }, places)
        .slice(0, limit)
        .map((p) => ({ ...p, category: cat, categoryLabel: SERVICE_CATEGORIES[cat].label }));
    })
  );

  const payload = { origin: { latitude: lat, longitude: lng }, categories: results, errors: [...new Set(errors)] };
  // Do not cache total failures so the next request can retry.
  if (Object.values(results).some((list) => list.length)) nearbyCache.set(key, payload);
  return payload;
};
