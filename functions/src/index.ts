import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
admin.initializeApp();

export const sendPushOnNotificationCreate = functions.firestore
  .document("notifications/{notifId}")
  .onCreate(async (snap: FirebaseFirestore.DocumentSnapshot) => {
    const notif = snap.data();
    if (!notif || !notif.userId) return null;

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(notif.userId)
      .get();

    const fcmToken = userDoc.exists && userDoc.data()?.fcmToken;
    if (!fcmToken) return null;

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: notif.title || "Notification",
        body: notif.body || "",
      },
      data: {
        type: notif.type || "",
        link: notif.link || "",
      },
    };

    try {
      await admin.messaging().send(message);
      return true;
    } catch (err) {
      console.error("Push send error:", err);
      return false;
    }
  });
