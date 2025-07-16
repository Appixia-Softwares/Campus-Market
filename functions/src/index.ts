/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
// setGlobalOptions({ maxInstances: 10 }); // This line is removed as per the edit hint.

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

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