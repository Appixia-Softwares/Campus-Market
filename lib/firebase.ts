import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDacVR49IYKM5NUgP6PlchNAH02Je9AhRk",
  authDomain: "universestay-8c0e4.firebaseapp.com",
  databaseURL: "https://universestay-8c0e4-default-rtdb.firebaseio.com",
  projectId: "universestay-8c0e4",
  storageBucket: "universestay-8c0e4.appspot.com",
  messagingSenderId: "984032807399",
  appId: "1:984032807399:web:50e0cdc71b62aec99d1542",
  measurementId: "G-6RYNDDKK5L"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export async function uploadFileToStorage(path: string, file: File | Blob): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function getMessagingInstance() {
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;
  const messaging = getMessaging(app);
  // Register the service worker for FCM
  await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  return messaging;
}

export { app, analytics, db, auth, storage, firebaseConfig }; 