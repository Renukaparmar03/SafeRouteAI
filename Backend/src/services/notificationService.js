import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getFirebaseMessaging } from '../config/firebase.js';
import { env } from '../config/env.js';
import { emitToUser } from '../sockets/socketEmitter.js';

const PREFERENCE_BY_TYPE = {
  RISK_ALERT: 'riskAlerts',
  TRIP_UPDATE: 'tripUpdates',
  WEATHER_ALERT: 'weatherAlerts',
};

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
]);

export const serializeNotification = (n) => ({
  id: n._id.toString(),
  title: n.title,
  message: n.message,
  type: n.type,
  severity: n.severity,
  data: n.data || {},
  read: n.read,
  delivered: n.delivered,
  isDemo: n.isDemo,
  createdAt: n.createdAt,
});

/**
 * Sends a browser push notification through Firebase Cloud Messaging.
 * Returns true when at least one device accepted the message.
 * When Firebase is not configured this is a no-op that returns false.
 */
export const sendPush = async (userId, { title, message, type, data = {} }) => {
  const messaging = getFirebaseMessaging();
  if (!messaging) return false;

  const user = await User.findById(userId).select('+notificationTokens notificationPreferences');
  if (!user?.notificationTokens?.length) return false;

  const prefs = user.notificationPreferences || {};
  if (prefs.push === false) return false;
  const prefKey = PREFERENCE_BY_TYPE[type];
  if (prefKey && prefs[prefKey] === false) return false;

  const stringData = Object.fromEntries(
    Object.entries({ ...data, type }).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  );

  try {
    const result = await messaging.sendEachForMulticast({
      tokens: user.notificationTokens,
      notification: { title, body: message },
      data: stringData,
      webpush: {
        fcmOptions: { link: `${env.clientUrls[0] || ''}/alerts` },
        notification: { icon: '/favicon.svg' },
      },
    });

    const invalid = result.responses
      .map((r, i) => (!r.success && INVALID_TOKEN_CODES.has(r.error?.code) ? user.notificationTokens[i] : null))
      .filter(Boolean);
    if (invalid.length) {
      await User.updateOne({ _id: userId }, { $pull: { notificationTokens: { $in: invalid } } });
    }
    return result.successCount > 0;
  } catch (error) {
    console.error(`[push] FCM send failed: ${error.message}`);
    return false;
  }
};

/**
 * Stores an in-app notification, emits it in real time over Socket.IO and
 * (optionally) sends it as a browser push notification.
 */
export const notifyUser = async (
  userId,
  { title, message, type = 'SYSTEM', severity = 'LOW', data = {}, push = true, event = 'journey:notification' }
) => {
  const notification = await Notification.create({ userId, title, message, type, severity, data });
  const payload = serializeNotification(notification);
  emitToUser(userId, event, payload);

  if (push) {
    const delivered = await sendPush(userId, { title, message, type, data: { notificationId: payload.id, ...data } });
    if (delivered) {
      notification.delivered = true;
      await notification.save();
      payload.delivered = true;
    }
  }
  return payload;
};
