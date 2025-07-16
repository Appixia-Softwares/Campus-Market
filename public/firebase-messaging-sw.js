importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDacVR49IYKM5NUgP6PlchNAH02Je9AhRk",
  authDomain: "universestay-8c0e4.firebaseapp.com",
  databaseURL: "https://universestay-8c0e4-default-rtdb.firebaseio.com",
  projectId: "universestay-8c0e4",
  storageBucket: "universestay-8c0e4.appspot.com",
  messagingSenderId: "984032807399",
  appId: "1:984032807399:web:50e0cdc71b62aec99d1542",
  measurementId: "G-6RYNDDKK5L"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/favicon.ico',
  });
}); 