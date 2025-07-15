import { adminDb, adminMessaging } from '../firebase-admin';

export async function sendPushNotification(userId: string, title: string, body: string, data: Record<string, any> = {}) {
  // Get the user's FCM token from Firestore
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const fcmToken = userDoc.get('fcmToken');
  if (!fcmToken) return;

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])), // FCM data must be string values
  };

  await adminMessaging.send(message);
} 