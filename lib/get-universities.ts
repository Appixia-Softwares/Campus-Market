import ZIM_UNIVERSITIES from "../utils/schools_data";

export async function getUniversities() {
  try {
    // Check if running in the browser (client)
    if (typeof window !== "undefined") {
      // Use client SDK
      const { db } = await import("../lib/firebase");
      const { collection, getDocs } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "schools"));
      if (!snap.empty) {
        return snap.docs.map(doc => doc.data());
      }
      return ZIM_UNIVERSITIES;
    } else {
      // Use Admin SDK (for server-side/Node.js)
      try {
        const admin = await import("firebase-admin");
        if (!admin.apps.length) {
          admin.initializeApp();
        }
        const db = admin.firestore();
        const snap = await db.collection("schools").get();
        if (!snap.empty) {
          return snap.docs.map(doc => doc.data());
        }
        return ZIM_UNIVERSITIES;
      } catch {
        // Admin SDK not available, fallback
        return ZIM_UNIVERSITIES;
      }
    }
  } catch {
    return ZIM_UNIVERSITIES;
  }
} 