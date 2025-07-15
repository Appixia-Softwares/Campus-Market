import * as admin from 'firebase-admin';

console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON');
  } catch (e) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is NOT valid JSON:', e);
  }
} else {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY is missing!');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
    ),
  });
}

export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging(); 