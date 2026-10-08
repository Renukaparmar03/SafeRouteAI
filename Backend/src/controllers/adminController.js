import mongoose from 'mongoose';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Alert from '../models/Alert.js';
import RiskZone from '../models/RiskZone.js';
import Notification from '../models/Notification.js';
import { integrationStatus } from '../config/env.js';
import { badRequest, notFound, sendSuccess } from '../utils/responseUtils.js';
import { serializeAlert, serializeTrip } from '../utils/serializers.js';
import { connectedUserCount, emitToAdmins, emitToUser } from '../sockets/socketEmitter.js';
import { notifyUser } from '../services/notificationService.js';

const DAY = 24 * 60 * 60 * 1000;
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const trend = (current, previous) => {
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  return { value: `${Math.abs(pct).toFixed(1)}%`, up: current >= previous };
};

const weekCounts = async (Model, filter = {}, field = 'createdAt') => {
  const now = Date.now();
  const [current, previous] = await Promise.all([
    Model.countDocuments({ ...filter, [field]: { $gte: new Date(now - 7 * DAY) } }),
    Model.countDocuments({ ...filter, [field]: { $gte: new Date(now - 14 * DAY), $lt: new Date(now - 7 * DAY) } }),
  ]);
  return trend(current, previous);
};

// GET /api/admin/stats
export const stats = async (req, res) => {
  const today = startOfToday();
  const activeZone = RiskZone.activeFilter();

  const [
    totalUsers,
    activeTrips,
    activeTravelers,
    totalTrips,
    zoneCounts,
    zonesUpdatedToday,
    activeSos,
    sosToday,
    riskWarningsToday,
    resolvedToday,
    highAlertsLastHour,
    riskyHours,
    topZones,
    recentAlerts,
    recentZones,
    connected,
    usersTrend,
    tripsTrend,
    zonesTrend,
    alertsTrend,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Trip.countDocuments({ status: 'active' }),
    Trip.distinct('userId', { status: 'active' }).then((ids) => ids.length),
    Trip.countDocuments({}),
    RiskZone.aggregate([{ $match: activeZone }, { $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
    RiskZone.countDocuments({ updatedAt: { $gte: today } }),
    Alert.countDocuments({ type: 'SOS', status: 'active' }),
    Alert.countDocuments({ type: 'SOS', createdAt: { $gte: today } }),
    Alert.countDocuments({ type: { $in: ['RISK_ZONE', 'ROUTE_DEVIATION', 'WEATHER'] }, createdAt: { $gte: today } }),
    Alert.countDocuments({ type: 'SOS', status: { $in: ['resolved', 'cancelled'] }, resolvedAt: { $gte: today } }),
    Alert.countDocuments({ severity: { $in: ['HIGH', 'CRITICAL'] }, createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } }),
    Alert.aggregate([
      { $match: { type: 'RISK_ZONE', createdAt: { $gte: new Date(Date.now() - 30 * DAY) } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Alert.aggregate([
      { $match: { riskZoneId: { $ne: null }, createdAt: { $gte: new Date(Date.now() - 30 * DAY) } } },
      { $group: { _id: '$riskZoneId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'riskzones', localField: '_id', foreignField: '_id', as: 'zone' } },
    ]),
    Alert.find({ type: { $in: ['SOS', 'RISK_ZONE', 'ROUTE_DEVIATION'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email phone')
      .populate('riskZoneId', 'name riskLevel'),
    RiskZone.find({}).sort({ updatedAt: -1 }).limit(3).select('name riskLevel updatedAt createdAt active sourceType'),
    connectedUserCount(),
    weekCounts(User, { role: 'user' }),
    weekCounts(Trip, { status: { $in: ['active', 'completed'] } }, 'startedAt'),
    weekCounts(RiskZone),
    weekCounts(Alert, { type: 'SOS' }),
  ]);

  const byLevel = Object.fromEntries(zoneCounts.map((z) => [z._id, z.count]));
  const zoneTotal = (byLevel.HIGH || 0) + (byLevel.MEDIUM || 0) + (byLevel.LOW || 0);
  const pct = (n) => (zoneTotal ? Math.round(((n || 0) / zoneTotal) * 100) : 0);

  const hour = riskyHours[0]?._id;
  const fmtHour = (h) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;

  const timeline = [
    ...recentAlerts.map((a) => ({
      title: a.type === 'SOS' ? 'SOS Alert Triggered' : a.type === 'RISK_ZONE' ? 'User Entered Risk Area' : 'Route Deviation',
      detail: a.riskZoneId?.name || a.meta?.address || (a.latitude ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}` : '—'),
      time: a.createdAt,
      type: a.type === 'SOS' ? 'critical' : 'warning',
    })),
    ...recentZones.map((z) => ({
      title: z.createdAt.getTime() === z.updatedAt.getTime() ? 'New Risk Zone Added' : z.active ? 'Risk Zone Updated' : 'Risk Zone Disabled',
      detail: `${z.name}${z.sourceType === 'DEMO' ? ' (DEMO)' : ''}`,
      time: z.updatedAt,
      type: z.riskLevel === 'LOW' ? 'success' : 'info',
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5);

  sendSuccess(res, {
    totals: {
      users: { value: totalUsers, trend: usersTrend },
      activeTrips: { value: activeTrips, trend: tripsTrend },
      dangerZones: { value: (byLevel.HIGH || 0) + (byLevel.MEDIUM || 0), trend: zonesTrend },
      lowRiskZones: { value: byLevel.LOW || 0, trend: zonesTrend },
      emergencyAlerts: { value: activeSos, trend: alertsTrend },
    },
    emergency: { sosToday, riskWarningsToday, resolvedToday, activeSos },
    liveMonitoring: {
      activeTravelers,
      monitoredTrips: activeTrips,
      totalTrips,
      connectedUsers: connected,
      overallRisk: highAlertsLastHour === 0 ? 'Low / Stable' : highAlertsLastHour < 5 ? 'Elevated' : 'High',
    },
    zoneAnalytics: {
      high: pct(byLevel.HIGH),
      medium: pct(byLevel.MEDIUM),
      low: pct(byLevel.LOW),
      total: zoneTotal,
      updatedToday: zonesUpdatedToday,
    },
    insights: {
      mostRiskyTime: Number.isInteger(hour) ? `${fmtHour(hour)} – ${fmtHour((hour + 1) % 24)} (UTC)` : null,
      mostReportedZone: topZones[0]?.zone?.[0]?.name || null,
      prediction: null,
    },
    recentAlerts: recentAlerts.map(serializeAlert),
    timeline,
    integrations: integrationStatus(),
  });
};

// GET /api/admin/users
export const listUsers = async (req, res) => {
  const { search, page, limit } = req.valid.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  const ids = users.map((u) => u._id);
  const [tripCounts, alertCounts] = await Promise.all([
    Trip.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    Alert.aggregate([
      { $match: { userId: { $in: ids }, severity: { $in: ['HIGH', 'CRITICAL'] }, createdAt: { $gte: new Date(Date.now() - 30 * DAY) } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]),
  ]);
  const tripsBy = Object.fromEntries(tripCounts.map((t) => [t._id.toString(), t.count]));
  const alertsBy = Object.fromEntries(alertCounts.map((a) => [a._id.toString(), a.count]));

  sendSuccess(res, {
    users: users.map((u) => {
      const highAlerts = alertsBy[u._id.toString()] || 0;
      return {
        ...u.toPublicJSON(),
        trips: tripsBy[u._id.toString()] || 0,
        highAlerts30d: highAlerts,
        riskProfile: highAlerts === 0 ? 'Safe' : highAlerts < 3 ? 'Medium' : 'High',
        lastLoginAt: u.lastLoginAt || null,
        isDemo: u.isDemo,
      };
    }),
    page,
    limit,
    total,
  });
};

// PUT /api/admin/users/:id
export const updateUser = async (req, res) => {
  if (req.valid.params.id === req.user._id.toString()) throw badRequest('You cannot change your own account here.');
  const user = await User.findByIdAndUpdate(req.valid.params.id, req.valid.body, { new: true, runValidators: true });
  if (!user) throw notFound('User not found');
  sendSuccess(res, { user: user.toPublicJSON() });
};

// GET /api/admin/trips?status=
export const listTrips = async (req, res) => {
  const { status, limit } = req.valid.query;
  const filter = status ? { status } : {};
  const trips = await Trip.find(filter)
    .select('-selectedRoute.steps')
    .sort({ status: 1, updatedAt: -1 })
    .limit(limit)
    .populate('userId', 'name email phone');
  sendSuccess(res, { trips: trips.map((t) => serializeTrip(t)) });
};

// GET /api/admin/alerts?type=&status=
export const listAlerts = async (req, res) => {
  const { type, status, limit } = req.valid.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  const today = startOfToday();
  const [alerts, activeSos, pending, resolvedToday] = await Promise.all([
    Alert.find(filter).sort({ createdAt: -1 }).limit(limit).populate('userId', 'name email phone').populate('riskZoneId', 'name riskLevel'),
    Alert.countDocuments({ type: 'SOS', status: 'active' }),
    Alert.countDocuments({ status: 'active', severity: { $in: ['HIGH', 'CRITICAL'] } }),
    Alert.countDocuments({ status: { $in: ['resolved', 'cancelled'] }, resolvedAt: { $gte: today } }),
  ]);
  sendSuccess(res, { alerts: alerts.map(serializeAlert), counts: { activeSos, pending, resolvedToday } });
};

// PUT /api/admin/alerts/:id/resolve
export const resolveAlert = async (req, res) => {
  const alert = await Alert.findById(req.valid.params.id).populate('userId', 'name');
  if (!alert) throw notFound('Alert not found');
  if (alert.status !== 'active') throw badRequest('This alert is already closed.');
  alert.status = 'resolved';
  alert.resolvedAt = new Date();
  alert.read = true;
  await alert.save();

  const serialized = serializeAlert(alert);
  emitToAdmins('sos:updated', serialized);
  if (alert.type === 'SOS') {
    emitToUser(alert.userId._id, 'sos:updated', serialized);
    await notifyUser(alert.userId._id, {
      title: 'SOS resolved',
      message: 'The response team marked your SOS as resolved. Stay safe!',
      type: 'SOS',
      severity: 'LOW',
      data: { alertId: serialized.id },
    });
  }
  sendSuccess(res, { alert: serialized });
};

// GET /api/admin/notifications — admin-sent notification history (grouped by message).
export const notificationHistory = async (req, res) => {
  const rows = await Notification.aggregate([
    { $match: { type: { $in: ['ADMIN_ALERT', 'WEATHER_ALERT', 'SYSTEM', 'RISK_ALERT'] }, 'data.sentBy': { $exists: true } } },
    {
      $group: {
        _id: { title: '$title', message: '$message', minute: { $dateTrunc: { date: '$createdAt', unit: 'minute' } } },
        severity: { $first: '$severity' },
        type: { $first: '$type' },
        target: { $first: '$data.target' },
        recipients: { $sum: 1 },
        delivered: { $sum: { $cond: ['$delivered', 1, 0] } },
        read: { $sum: { $cond: ['$read', 1, 0] } },
        createdAt: { $first: '$createdAt' },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 50 },
  ]);
  sendSuccess(res, {
    history: rows.map((r) => ({
      title: r._id.title,
      message: r._id.message,
      severity: r.severity,
      type: r.type,
      target: r.target,
      recipients: r.recipients,
      delivered: r.delivered,
      read: r.read,
      createdAt: r.createdAt,
    })),
  });
};

// GET /api/admin/system-status
export const systemStatus = async (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  sendSuccess(res, {
    database: { state: dbState, name: mongoose.connection.name, host: mongoose.connection.host },
    integrations: integrationStatus(),
    connectedUsers: await connectedUserCount(),
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
  });
};
