import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import { env, integrationStatus } from '../config/env.js';
import { badRequest, notFound, sendSuccess } from '../utils/responseUtils.js';
import { notifyUser, serializeNotification } from '../services/notificationService.js';
import { emitToAdmins } from '../sockets/socketEmitter.js';

const MAX_TOKENS_PER_USER = 5;

// GET /api/notifications
export const listNotifications = async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.unread === 'true') filter.read = false;
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(100),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);
  sendSuccess(res, { notifications: notifications.map(serializeNotification), unreadCount });
};

// PUT /api/notifications/:id/read
export const markRead = async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.valid.params.id, userId: req.user._id }, { read: true }, { new: true });
  if (!n) throw notFound('Notification not found');
  sendSuccess(res, { notification: serializeNotification(n) });
};

// PUT /api/notifications/read-all
export const markAllRead = async (req, res) => {
  const result = await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  sendSuccess(res, { updated: result.modifiedCount });
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.valid.params.id, userId: req.user._id });
  if (!result.deletedCount) throw notFound('Notification not found');
  sendSuccess(res, { deleted: true });
};

// GET /api/notifications/config — tells the client whether push is available.
export const pushConfig = async (req, res) => {
  sendSuccess(res, { pushEnabled: integrationStatus().firebase && Boolean(env.firebase.vapidKey), vapidKey: env.firebase.vapidKey || null });
};

// POST /api/notifications/register-token
export const registerToken = async (req, res) => {
  const { token } = req.valid.body;
  const user = await User.findById(req.user._id).select('+notificationTokens');
  const tokens = [token, ...(user.notificationTokens || []).filter((t) => t !== token)].slice(0, MAX_TOKENS_PER_USER);
  user.notificationTokens = tokens;
  await user.save();
  sendSuccess(res, { registered: true });
};

// DELETE /api/notifications/register-token
export const unregisterToken = async (req, res) => {
  const { token } = req.valid.body;
  await User.updateOne({ _id: req.user._id }, { $pull: { notificationTokens: token } });
  sendSuccess(res, { unregistered: true });
};

// POST /api/notifications/send  (admin)
export const sendNotification = async (req, res) => {
  const { title, message, severity, type, target, userId } = req.valid.body;

  let userIds;
  if (target === 'user') {
    if (!userId) throw badRequest('Select a user to notify.');
    if (!(await User.exists({ _id: userId }))) throw notFound('User not found');
    userIds = [userId];
  } else if (target === 'active-trips') {
    userIds = await Trip.distinct('userId', { status: 'active' });
  } else {
    userIds = await User.distinct('_id', { isActive: true, role: 'user' });
  }

  const results = await Promise.all(
    userIds.map((id) =>
      notifyUser(id, {
        title,
        message,
        type,
        severity,
        data: { sentBy: req.user._id.toString(), target },
        event: 'admin:notification',
      })
    )
  );

  const summary = {
    target,
    recipients: results.length,
    pushDelivered: results.filter((r) => r.delivered).length,
    pushConfigured: integrationStatus().firebase,
  };
  emitToAdmins('admin:notification-sent', { title, message, severity, type, ...summary, sentAt: new Date().toISOString() });
  sendSuccess(res, summary, 201);
};
