import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import ZIM_UNIVERSITIES from "../utils/schools_data";

export async function getUniversities() {
  try {
    const snap = await getDocs(collection(db, "schools"));
    if (!snap.empty) {
      return snap.docs.map(doc => doc.data());
    }
    return ZIM_UNIVERSITIES;
  } catch (err) {
    return ZIM_UNIVERSITIES;
  }
} 