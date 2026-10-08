import Alert from '../models/Alert.js';
import { notFound, sendSuccess } from '../utils/responseUtils.js';
import { serializeAlert } from '../utils/serializers.js';

// GET /api/alerts
export const listAlerts = async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.tripId && /^[a-f\d]{24}$/i.test(req.query.tripId)) filter.tripId = req.query.tripId;
  if (req.query.unread === 'true') filter.read = false;
  const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100).populate('riskZoneId', 'name riskLevel');
  const unreadCount = await Alert.countDocuments({ userId: req.user._id, read: false });
  sendSuccess(res, { alerts: alerts.map(serializeAlert), unreadCount });
};

// PUT /api/alerts/:id/read
export const markAlertRead = async (req, res) => {
  const alert = await Alert.findOneAndUpdate({ _id: req.valid.params.id, userId: req.user._id }, { read: true }, { new: true });
  if (!alert) throw notFound('Alert not found');
  sendSuccess(res, { alert: serializeAlert(alert) });
};

// PUT /api/alerts/read-all
export const markAllAlertsRead = async (req, res) => {
  const result = await Alert.updateMany({ userId: req.user._id, read: false }, { read: true });
  sendSuccess(res, { updated: result.modifiedCount });
};
