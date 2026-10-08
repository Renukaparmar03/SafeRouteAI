import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { notificationService } from './notificationService';

// Firebase web config is public by design (it identifies the project, it is not a secret).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = () => Object.values(firebaseConfig).every(Boolean);

export const pushPermission = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

/**
 * Asks for notification permission, obtains an FCM registration token and
 * sends it to the backend. Returns { enabled, reason }.
 */
export const enablePushNotifications = async ({ prompt = true } = {}) => {
  if (!isFirebaseConfigured()) return { enabled: false, reason: 'Push notifications are not configured (missing VITE_FIREBASE_* settings).' };
  if (!(await isSupported().catch(() => false)) || !('serviceWorker' in navigator)) {
    return { enabled: false, reason: 'This browser does not support push notifications.' };
  }

  const config = await notificationService.pushConfig();
  if (!config.pushEnabled) return { enabled: false, reason: 'Push notifications are not configured on the server.' };

  let permission = Notification.permission;
  if (permission === 'default' && prompt) permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { enabled: false, reason: permission === 'denied' ? 'Notifications are blocked in your browser settings.' : 'Notification permission was not granted.' };
  }

  const app = getApps()[0] || initializeApp(firebaseConfig);
  // The service worker cannot read Vite env vars, so the public config is passed in its URL.
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams(firebaseConfig)}`);
  const token = await getToken(getMessaging(app), { vapidKey: config.vapidKey, serviceWorkerRegistration: registration });
  if (!token) return { enabled: false, reason: 'Could not obtain a push token.' };

  await notificationService.registerToken(token);
  return { enabled: true, token };
};
