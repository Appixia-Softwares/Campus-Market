// [START initialize_firebase_in_sw]
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDacVR49IYKM5NUgP6PlchNAH02Je9AhRk",
  authDomain: "universestay-8c0e4.firebaseapp.com",
  projectId: "universestay-8c0e4",
  storageBucket: "universestay-8c0e4.appspot.com",
  messagingSenderId: "984032807399",
  appId: "1:984032807399:web:50e0cdc71b62aec99d1542",
  measurementId: "G-6RYNDDKK5L"
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || 'Campus Market';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.ico',
    data: payload.data || {},
    actions: payload.notification?.actions || []
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
// [END initialize_firebase_in_sw] 