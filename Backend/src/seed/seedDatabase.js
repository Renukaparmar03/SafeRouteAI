/**
 * DEMO / SAMPLE data for local development and testing.
 *
 * Every record created here is flagged (isDemo: true, or sourceType: 'DEMO'
 * for risk zones) and is NOT real-world data. The demo risk zones are
 * synthetic shapes placed around Indore purely so the map, alerts and
 * scoring can be exercised. They do not represent real crime locations.
 *
 * Re-running the script only replaces previous demo records.
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { validateEnv } from '../config/env.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import RiskZone from '../models/RiskZone.js';
import Alert from '../models/Alert.js';
import Notification from '../models/Notification.js';
import EmergencyContact from '../models/EmergencyContact.js';
import LocationPoint from '../models/LocationPoint.js';
import AIConversation from '../models/AIConversation.js';
import { circlePolygon } from '../utils/geoUtils.js';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@saferoute.demo';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
const USER_EMAIL = process.env.SEED_USER_EMAIL || 'demo@saferoute.demo';
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'Demo@12345';

const DEMO_NOTE = 'DEMO/SAMPLE zone for development testing only. Not a real crime or incident location.';

// Synthetic zones around Indore (22.7196, 75.8577). Names are deliberately generic.
const DEMO_ZONES = [
  { name: 'DEMO Zone A (High)', riskLevel: 'HIGH', lat: 22.7246, lng: 75.8653, radius: 450, activeHours: 'ALWAYS', confidence: 0.6 },
  { name: 'DEMO Zone B (High, night only)', riskLevel: 'HIGH', lat: 22.7101, lng: 75.8431, radius: 400, activeHours: 'NIGHT', confidence: 0.5 },
  { name: 'DEMO Zone C (Medium)', riskLevel: 'MEDIUM', lat: 22.7333, lng: 75.8478, radius: 600, activeHours: 'ALWAYS', confidence: 0.6 },
  { name: 'DEMO Zone D (Medium)', riskLevel: 'MEDIUM', lat: 22.7052, lng: 75.8720, radius: 500, activeHours: 'ALWAYS', confidence: 0.55 },
  { name: 'DEMO Zone E (Low)', riskLevel: 'LOW', lat: 22.7190, lng: 75.8820, radius: 700, activeHours: 'ALWAYS', confidence: 0.7 },
  { name: 'DEMO Zone F (Medium, highway sample)', riskLevel: 'MEDIUM', lat: 22.9500, lng: 75.8200, radius: 1200, activeHours: 'ALWAYS', confidence: 0.4 },
];

const place = (name, latitude, longitude) => ({ name, latitude, longitude });
const INDORE = place('Rajwada, Indore, Madhya Pradesh (DEMO trip)', 22.7186, 75.8551);
const UJJAIN = place('Ujjain, Madhya Pradesh (DEMO trip)', 23.1765, 75.7885);
const BHOPAL = place('Bhopal, Madhya Pradesh (DEMO trip)', 23.2599, 77.4126);
const MHOW = place('Mhow, Madhya Pradesh (DEMO trip)', 22.5524, 75.7569);

/** Straight-ish synthetic line between two places (DEMO geometry, not a real road route). */
const demoLine = (a, b, points = 12) => ({
  type: 'LineString',
  coordinates: Array.from({ length: points + 1 }, (_, i) => {
    const t = i / points;
    const wobble = Math.sin(t * Math.PI) * 0.02;
    return [a.longitude + (b.longitude - a.longitude) * t + wobble, a.latitude + (b.latitude - a.latitude) * t];
  }),
});

const demoRoute = (a, b, distance, duration, score, riskLevel) => ({
  summary: 'DEMO route (synthetic geometry)',
  geometry: demoLine(a, b),
  distance,
  duration,
  safetyScore: score,
  riskLevel,
  profile: 'driving',
  factors: [
    { label: 'DEMO data: synthetic route for testing', impact: 0, kind: 'neutral' },
    { label: 'Daytime travel', impact: 0, kind: 'positive' },
  ],
  recommendation: 'DEMO trip. Plan a real trip to see live route analysis.',
  riskZoneIds: [],
  steps: [],
});

const run = async () => {
  validateEnv();
  await connectDB();
  await Promise.all([
    RiskZone.syncIndexes(),
    LocationPoint.syncIndexes(),
    Trip.syncIndexes(),
    Alert.syncIndexes(),
    Notification.syncIndexes(),
    User.syncIndexes(),
  ]);

  console.log('[seed] Removing previous DEMO records…');
  const demoUsers = await User.find({ isDemo: true }).select('_id');
  const demoUserIds = demoUsers.map((u) => u._id);
  await Promise.all([
    RiskZone.deleteMany({ sourceType: 'DEMO' }),
    Trip.deleteMany({ $or: [{ isDemo: true }, { userId: { $in: demoUserIds } }] }),
    Alert.deleteMany({ $or: [{ isDemo: true }, { userId: { $in: demoUserIds } }] }),
    Notification.deleteMany({ $or: [{ isDemo: true }, { userId: { $in: demoUserIds } }] }),
    EmergencyContact.deleteMany({ $or: [{ isDemo: true }, { userId: { $in: demoUserIds } }] }),
    LocationPoint.deleteMany({ userId: { $in: demoUserIds } }),
    AIConversation.deleteMany({ userId: { $in: demoUserIds } }),
  ]);
  await User.deleteMany({ isDemo: true });

  const [adminHash, userHash] = await Promise.all([bcrypt.hash(ADMIN_PASSWORD, 12), bcrypt.hash(USER_PASSWORD, 12)]);

  const conflicting = await User.findOne({ email: { $in: [ADMIN_EMAIL, USER_EMAIL] }, isDemo: false });
  if (conflicting) throw new Error(`A real (non-demo) account already uses ${conflicting.email}. Set SEED_ADMIN_EMAIL / SEED_USER_EMAIL.`);

  const admin = await User.create({ name: 'Demo Admin', email: ADMIN_EMAIL, passwordHash: adminHash, role: 'admin', isDemo: true });
  const user = await User.create({ name: 'Demo Traveller', email: USER_EMAIL, phone: '+910000000001', passwordHash: userHash, isDemo: true });

  const zones = await RiskZone.insertMany(
    DEMO_ZONES.map((z) => ({
      name: z.name,
      description: DEMO_NOTE,
      riskLevel: z.riskLevel,
      geometry: circlePolygon(z.lat, z.lng, z.radius),
      center: { latitude: z.lat, longitude: z.lng },
      radius: z.radius,
      activeHours: z.activeHours,
      sourceType: 'DEMO',
      sourceName: 'SafeRoute AI seed script (synthetic)',
      confidence: z.confidence,
      active: true,
      createdBy: admin._id,
    }))
  );

  await EmergencyContact.insertMany([
    { userId: user._id, name: 'Demo Contact (Family)', phone: '+910000000002', relationship: 'Family', priority: 1, isDemo: true },
    { userId: user._id, name: 'Demo Contact (Friend)', phone: '+910000000003', relationship: 'Friend', priority: 2, isDemo: true },
  ]);

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const [planned, , completed] = await Trip.insertMany([
    {
      userId: user._id,
      from: INDORE,
      destination: UJJAIN,
      travelDate: new Date(now + 2 * day),
      travelers: 2,
      travelMode: 'car',
      routePreference: 'safest',
      selectedRoute: demoRoute(INDORE, UJJAIN, 55000, 4200, 82, 'LOW'),
      distance: 55000,
      duration: 4200,
      safetyScore: 82,
      weatherSummary: 'DEMO: weather is fetched live when you open the trip.',
      status: 'planned',
      isDemo: true,
    },
    {
      userId: user._id,
      from: INDORE,
      destination: BHOPAL,
      travelDate: new Date(now + 10 * day),
      travelers: 1,
      travelMode: 'bus',
      routePreference: 'fastest',
      selectedRoute: demoRoute(INDORE, BHOPAL, 195000, 12600, 74, 'MEDIUM'),
      distance: 195000,
      duration: 12600,
      safetyScore: 74,
      status: 'planned',
      isDemo: true,
    },
    {
      userId: user._id,
      from: INDORE,
      destination: MHOW,
      travelDate: new Date(now - 5 * day),
      travelers: 3,
      travelMode: 'car',
      routePreference: 'safest',
      selectedRoute: demoRoute(INDORE, MHOW, 24000, 2100, 88, 'LOW'),
      distance: 24000,
      duration: 2100,
      safetyScore: 88,
      status: 'completed',
      startedAt: new Date(now - 5 * day),
      endedAt: new Date(now - 5 * day + 2400 * 1000),
      summary: { locationPoints: 0, alertsCount: 1, distanceTravelled: 24000 },
      isDemo: true,
    },
  ]);

  await Alert.insertMany([
    {
      userId: user._id,
      tripId: completed._id,
      type: 'RISK_ZONE',
      title: 'Medium-risk zone ahead',
      message: `DEMO alert: approaching ${zones[2].name}.`,
      severity: 'LOW',
      latitude: zones[2].center.latitude,
      longitude: zones[2].center.longitude,
      riskZoneId: zones[2]._id,
      read: true,
      isDemo: true,
      createdAt: new Date(now - 5 * day + 900 * 1000),
    },
  ]);

  await Notification.insertMany([
    {
      userId: user._id,
      title: 'Welcome to SafeRoute AI (DEMO)',
      message: 'This is a DEMO notification created by the seed script.',
      type: 'SYSTEM',
      severity: 'LOW',
      isDemo: true,
    },
    {
      userId: user._id,
      title: 'Trip planned (DEMO)',
      message: `DEMO: your trip to ${planned.destination.name} is saved.`,
      type: 'TRIP_UPDATE',
      severity: 'LOW',
      data: { tripId: planned._id.toString() },
      isDemo: true,
    },
  ]);

  console.log('[seed] Done. DEMO accounts:');
  console.log(`        admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`        user : ${USER_EMAIL} / ${USER_PASSWORD}`);
  console.log(`[seed] ${zones.length} DEMO risk zones around Indore, 3 DEMO trips, 2 emergency contacts.`);
};

run()
  .catch((error) => {
    console.error(`[seed] Failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
