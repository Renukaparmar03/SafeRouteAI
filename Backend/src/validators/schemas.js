import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const lat = z.coerce.number().min(-90).max(90);
const lng = z.coerce.number().min(-180).max(180);
const trimmed = (max) => z.string().trim().max(max);

export const idParams = z.object({ id: objectId });
export const tripIdParams = z.object({ tripId: objectId });

export const latLngQuery = z.object({ lat, lng });

// ---------- Auth ----------
export const registerSchema = z
  .object({
    name: trimmed(80).min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().toLowerCase().email('Enter a valid email').optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number')
      .optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    role: z.enum(['user', 'admin']).optional(),
    adminCode: z.string().max(200).optional(),
  })
  .refine((v) => v.email || v.phone, { message: 'Email or phone is required', path: ['email'] });

export const loginSchema = z.object({
  emailOrPhone: trimmed(120).min(3, 'Enter your email or phone'),
  password: z.string().min(1, 'Enter your password').max(128),
  role: z.enum(['user', 'admin']).optional(),
});

// ---------- User ----------
export const updateMeSchema = z.object({
  name: trimmed(80).min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  profileImage: z.string().trim().url('Profile image must be a URL').max(500).optional().or(z.literal('')),
  notificationPreferences: z
    .object({
      push: z.boolean().optional(),
      riskAlerts: z.boolean().optional(),
      tripUpdates: z.boolean().optional(),
      weatherAlerts: z.boolean().optional(),
    })
    .optional(),
});

export const contactSchema = z.object({
  name: trimmed(80).min(2, 'Contact name is required'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number'),
  relationship: trimmed(40).optional().default(''),
  priority: z.coerce.number().int().min(1).max(10).optional().default(1),
});

// ---------- Places / trips ----------
const placeSchema = z.object({
  name: trimmed(300).min(1),
  latitude: lat,
  longitude: lng,
});

const lineString = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([lng, lat]).or(z.array(z.number()).min(2))).min(2).max(20000),
});

export const ROUTE_PREFERENCES = ['safest', 'fastest', 'shortest', 'avoid-tolls', 'avoid-risk'];
export const TRAVEL_MODES = ['car', 'bike', 'bus', 'train', 'walk'];

export const routeRequestSchema = z.object({
  from: placeSchema,
  destination: placeSchema,
  travelMode: z.enum(TRAVEL_MODES).optional().default('car'),
  routePreference: z.enum(ROUTE_PREFERENCES).optional().default('safest'),
  departureTime: z.coerce.date().optional(),
  steps: z.boolean().optional().default(false),
});

export const createTripSchema = z.object({
  from: placeSchema,
  destination: placeSchema,
  travelDate: z.coerce.date(),
  travelers: z.coerce.number().int().min(1).max(50).optional().default(1),
  travelMode: z.enum(TRAVEL_MODES).optional().default('car'),
  routePreference: z.enum(ROUTE_PREFERENCES).optional().default('safest'),
  // The client sends back the route it selected from /api/map/route; the
  // server re-validates and re-scores it rather than trusting client scores.
  selectedRoute: z
    .object({
      geometry: lineString,
      distance: z.number().nonnegative(),
      duration: z.number().nonnegative(),
      summary: trimmed(300).optional(),
      steps: z
        .array(
          z.object({
            instruction: trimmed(500).optional(),
            distance: z.number().optional(),
            duration: z.number().optional(),
            name: trimmed(200).optional(),
            maneuver: z
              .object({ type: trimmed(50).optional(), modifier: trimmed(50).optional(), location: z.array(z.number()).optional() })
              .optional(),
          })
        )
        .max(3000)
        .optional(),
      profile: trimmed(40).optional(),
    })
    .optional(),
});

export const updateTripSchema = z.object({
  travelDate: z.coerce.date().optional(),
  travelers: z.coerce.number().int().min(1).max(50).optional(),
  routePreference: z.enum(ROUTE_PREFERENCES).optional(),
  status: z.enum(['planned', 'cancelled']).optional(),
});

export const tripsQuery = z.object({
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).optional(),
});

// ---------- Map ----------
export const searchQuery = z.object({
  q: trimmed(200).min(2, 'Search text is too short'),
  lat: lat.optional(),
  lng: lng.optional(),
  limit: z.coerce.number().int().min(1).max(10).optional().default(5),
});

export const nearbyQuery = z.object({
  lat,
  lng,
  category: z.enum(['hospital', 'police', 'pharmacy', 'fuel', 'all']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

// ---------- Risk zones ----------
export const zonesQuery = z.object({
  lat: lat.optional(),
  lng: lng.optional(),
  radius: z.coerce.number().min(100).max(200000).optional().default(25000),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  bbox: z
    .string()
    .regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/, 'bbox must be minLng,minLat,maxLng,maxLat')
    .optional(),
  includeInactive: z.enum(['true', 'false']).optional(),
});

export const nearbyZonesQuery = z.object({
  lat,
  lng,
  radius: z.coerce.number().min(50).max(50000).optional().default(5000),
});

const polygonGeometry = z.object({
  type: z.enum(['Polygon', 'MultiPolygon']),
  coordinates: z.array(z.any()).min(1),
});

export const riskZoneSchema = z
  .object({
    name: trimmed(150).min(2, 'Zone name is required'),
    description: trimmed(1000).optional().default(''),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    latitude: lat.optional(),
    longitude: lng.optional(),
    radius: z.coerce.number().min(20).max(50000).optional(),
    geometry: polygonGeometry.optional(),
    activeHours: z.enum(['ALWAYS', 'NIGHT', 'DAY']).optional().default('ALWAYS'),
    sourceType: z.enum(['OFFICIAL', 'ADMIN', 'COMMUNITY', 'DEMO']).optional().default('ADMIN'),
    sourceName: trimmed(200).optional().default(''),
    confidence: z.coerce.number().min(0).max(1).optional().default(0.7),
    active: z.boolean().optional().default(true),
    validFrom: z.coerce.date().optional().nullable(),
    validUntil: z.coerce.date().optional().nullable(),
  })
  .refine((v) => v.geometry || (v.latitude !== undefined && v.longitude !== undefined && v.radius), {
    message: 'Provide either a polygon geometry or latitude, longitude and radius',
    path: ['geometry'],
  });

export const riskZoneUpdateSchema = z.object({
  name: trimmed(150).min(2).optional(),
  description: trimmed(1000).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  latitude: lat.optional(),
  longitude: lng.optional(),
  radius: z.coerce.number().min(20).max(50000).optional(),
  geometry: polygonGeometry.optional(),
  activeHours: z.enum(['ALWAYS', 'NIGHT', 'DAY']).optional(),
  sourceType: z.enum(['OFFICIAL', 'ADMIN', 'COMMUNITY', 'DEMO']).optional(),
  sourceName: trimmed(200).optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
  active: z.boolean().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
});

// ---------- Tracking ----------
export const locationSchema = z.object({
  tripId: objectId,
  latitude: lat,
  longitude: lng,
  accuracy: z.coerce.number().min(0).max(100000).optional(),
  speed: z.coerce.number().min(0).max(500).optional().nullable(),
  heading: z.coerce.number().min(0).max(360).optional().nullable(),
  timestamp: z.coerce.date().optional(),
});

export const trackingTripSchema = z.object({ tripId: objectId });

// ---------- Notifications ----------
export const registerTokenSchema = z.object({ token: z.string().trim().min(20).max(4096) });

export const adminNotificationSchema = z.object({
  title: trimmed(200).min(2, 'Title is required'),
  message: trimmed(2000).min(2, 'Message is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  type: z.enum(['RISK_ALERT', 'TRIP_UPDATE', 'WEATHER_ALERT', 'ADMIN_ALERT', 'SOS', 'SYSTEM']).optional().default('ADMIN_ALERT'),
  target: z.enum(['all', 'active-trips', 'user']).optional().default('all'),
  userId: objectId.optional(),
});

// ---------- Emergency ----------
export const sosSchema = z.object({
  latitude: lat,
  longitude: lng,
  tripId: objectId.optional().nullable(),
  emergencyType: trimmed(40).optional().default('others'),
  message: trimmed(1000).optional().default(''),
  accuracy: z.coerce.number().min(0).optional(),
});

// ---------- AI ----------
export const aiChatSchema = z.object({
  message: trimmed(2000).min(1, 'Message is required'),
  tripId: objectId.optional().nullable(),
  latitude: lat.optional().nullable(),
  longitude: lng.optional().nullable(),
  conversationId: objectId.optional().nullable(),
});

// ---------- Admin ----------
export const adminUsersQuery = z.object({
  search: trimmed(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminUserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const adminAlertsQuery = z.object({
  type: z.enum(['RISK_ZONE', 'ROUTE_DEVIATION', 'WEATHER', 'SOS', 'ADMIN', 'TRIP']).optional(),
  status: z.enum(['active', 'resolved', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export const adminTripsQuery = z.object({
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
