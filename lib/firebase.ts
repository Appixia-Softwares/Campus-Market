import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

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

export { app, analytics, db }; 