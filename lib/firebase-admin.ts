import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

let app: App | null = null;
let adminDb = null;
let adminMessaging = null;

if (privateKey && clientEmail && projectId) {
  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
  if (!getApps().length) {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  } else {
    app = getApps()[0];
  }
  adminDb = getFirestore(app);
  adminMessaging = getMessaging(app);
}

export { adminDb, adminMessaging }; 