import Alert from '../models/Alert.js';
import Trip from '../models/Trip.js';
import EmergencyContact from '../models/EmergencyContact.js';
import { integrationStatus } from '../config/env.js';
import { badRequest, notFound, sendSuccess } from '../utils/responseUtils.js';
import { serializeAlert } from '../utils/serializers.js';
import { findNearbyServices, reverseGeocode } from '../services/mapService.js';
import { notifyUser } from '../services/notificationService.js';
import { emitToAdmins, emitToUser } from '../sockets/socketEmitter.js';

const EMERGENCY_LABELS = {
  health: 'Health Issue',
  police: 'Police',
  ambulance: 'Ambulance',
  fire: 'Fire',
  vehicle: 'Vehicle Breakdown',
  women_safety: 'Women Safety',
  disaster: 'Natural Disaster',
  others: 'Others',
};

// GET /api/emergency/services?lat=&lng=&category=
export const services = async (req, res) => {
  const data = await findNearbyServices(req.valid.query);
  sendSuccess(res, data);
};

// POST /api/emergency/sos
export const triggerSos = async (req, res) => {
  const { latitude, longitude, tripId, emergencyType, message, accuracy } = req.valid.body;
  const user = req.user;

  let trip = null;
  if (tripId) {
    trip = await Trip.findOne({ _id: tripId, userId: user._id }).lean();
    if (!trip) throw notFound('Trip not found');
  } else {
    trip = await Trip.findOne({ userId: user._id, status: 'active' }).lean();
  }

  let place = null;
  try {
    place = await reverseGeocode({ lat: latitude, lng: longitude });
  } catch {
    place = null;
  }

  const contacts = await EmergencyContact.find({ userId: user._id }).sort({ priority: 1 }).lean();
  const smsConfigured = integrationStatus().sms;
  // No SMS provider is integrated: contacts are recorded and the attempt is logged, never faked as "sent".
  const contactResults = contacts.map((c) => ({
    name: c.name,
    phone: c.phone,
    relationship: c.relationship,
    status: smsConfigured ? 'queued' : 'not_sent_no_sms_provider',
  }));
  if (contacts.length && !smsConfigured) {
    console.info(`[sos] SMS provider not configured; ${contacts.length} emergency contact(s) of user ${user._id} were not messaged.`);
  }

  const typeLabel = EMERGENCY_LABELS[emergencyType] || emergencyType;
  const alert = await Alert.create({
    userId: user._id,
    tripId: trip?._id,
    type: 'SOS',
    severity: 'CRITICAL',
    title: `SOS: ${typeLabel}`,
    message: message || `${user.name} triggered an SOS (${typeLabel}).`,
    latitude,
    longitude,
    status: 'active',
    meta: {
      emergencyType,
      emergencyLabel: typeLabel,
      accuracy: accuracy ?? null,
      address: place?.fullAddress || null,
      contacts: contactResults,
      smsConfigured,
    },
  });

  const serialized = serializeAlert(alert);
  const adminPayload = {
    ...serialized,
    user: { id: user._id.toString(), name: user.name, phone: user.phone || null, email: user.email || null },
    trip: trip ? { id: trip._id.toString(), from: trip.from.name, destination: trip.destination.name } : null,
  };
  emitToAdmins('sos:triggered', adminPayload);
  emitToUser(user._id, 'sos:triggered', serialized);
  await notifyUser(user._id, {
    title: 'SOS activated',
    message: 'Your SOS and live location were sent to the SafeRoute response team.',
    type: 'SOS',
    severity: 'CRITICAL',
    data: { alertId: serialized.id },
  });

  sendSuccess(
    res,
    {
      sos: serialized,
      location: { latitude, longitude, address: place?.fullAddress || null },
      contacts: contactResults,
      smsConfigured,
      adminNotified: true,
    },
    201
  );
};

// PUT /api/emergency/sos/:id/cancel
export const cancelSos = async (req, res) => {
  const alert = await Alert.findOne({ _id: req.valid.params.id, userId: req.user._id, type: 'SOS' });
  if (!alert) throw notFound('SOS not found');
  if (alert.status !== 'active') throw badRequest('This SOS is no longer active.');
  alert.status = 'cancelled';
  alert.resolvedAt = new Date();
  await alert.save();
  const serialized = serializeAlert(alert);
  emitToAdmins('sos:updated', { ...serialized, user: { id: req.user._id.toString(), name: req.user.name } });
  sendSuccess(res, { sos: serialized });
};

// GET /api/emergency/sos/active
export const activeSos = async (req, res) => {
  const alert = await Alert.findOne({ userId: req.user._id, type: 'SOS', status: 'active' }).sort({ createdAt: -1 });
  sendSuccess(res, { sos: alert ? serializeAlert(alert) : null });
};
