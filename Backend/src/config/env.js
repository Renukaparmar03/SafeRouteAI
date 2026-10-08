import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Central place for every environment variable the backend reads.
 * Required variables stop the server at boot; optional integrations are
 * reported as "not configured" so the related features fail loudly instead
 * of silently returning fake data.
 */
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];

const OPTIONAL_INTEGRATIONS = {
  gemini: ['GEMINI_API_KEY'],
  firebase: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
};

const isSet = (key) => typeof process.env[key] === 'string' && process.env[key].trim() !== '';

export const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !isSet(key));
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy Backend/.env.example to Backend/.env and fill them in.'
    );
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }

  console.info(
    isSet('MAPBOX_ACCESS_TOKEN')
      ? '[env] Map data: Mapbox (search, routes, places).'
      : '[env] Map data: OpenStreetMap (Photon search, OSRM routes, Overpass places). Set MAPBOX_ACCESS_TOKEN to use Mapbox instead.'
  );

  Object.entries(OPTIONAL_INTEGRATIONS).forEach(([name, keys]) => {
    const absent = keys.filter((key) => !isSet(key));
    if (absent.length) {
      console.warn(`[env] ${name} is not configured (missing ${absent.join(', ')}). Related features will return a setup error.`);
    }
  });
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  mongoDnsServers: process.env.MONGODB_DNS_SERVERS,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  adminRegistrationCode: process.env.ADMIN_REGISTRATION_CODE || '',

  mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    // Private keys copied into .env usually contain literal "\n" sequences.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    vapidKey: process.env.FCM_WEB_VAPID_KEY || '',
  },

  // Free OpenStreetMap-based providers used when no Mapbox token is configured.
  photonUrl: (process.env.PHOTON_API_URL || 'https://photon.komoot.io').replace(/\/$/, ''),
  osrmUrl: (process.env.OSRM_API_URL || 'https://routing.openstreetmap.de').replace(/\/$/, ''),

  openMeteoBaseUrl: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1',
  // Comma-separated; mirrors are tried in order when one is overloaded.
  overpassUrls: (process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),

  tracking: {
    alertCooldownMs: toNumber(process.env.ALERT_COOLDOWN_MINUTES, 5) * 60 * 1000,
    nearbyZoneMeters: toNumber(process.env.NEARBY_ZONE_METERS, 500),
    routeDeviationMeters: toNumber(process.env.ROUTE_DEVIATION_METERS, 250),
    minStoreIntervalMs: toNumber(process.env.LOCATION_MIN_INTERVAL_SECONDS, 15) * 1000,
    minStoreDistanceMeters: toNumber(process.env.LOCATION_MIN_DISTANCE_METERS, 25),
    retentionDays: toNumber(process.env.LOCATION_RETENTION_DAYS, 30),
  },
};

export const integrationStatus = () => ({
  maps: true, // OpenStreetMap providers need no key
  mapProvider: env.mapboxToken ? 'mapbox' : 'osm',
  mapbox: Boolean(env.mapboxToken),
  gemini: Boolean(env.geminiApiKey),
  firebase: Boolean(env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey),
  openMeteo: true,
  sms: false,
});
