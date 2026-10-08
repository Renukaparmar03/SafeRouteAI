import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env, integrationStatus } from './env.js';

let messaging = null;

/**
 * Returns the Firebase Cloud Messaging client, or null when Firebase
 * credentials are not configured. Callers must handle the null case.
 */
export const getFirebaseMessaging = () => {
  if (messaging) return messaging;
  if (!integrationStatus().firebase) return null;

  try {
    const app =
      getApps()[0] ||
      initializeApp({
        credential: cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      });
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error(`[firebase] Failed to initialise Firebase Admin: ${error.message}`);
    return null;
  }
};
