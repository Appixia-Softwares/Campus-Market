import { db } from "../lib/firebase";
import ZIM_UNIVERSITIES from "../utils/schools_data";
import { collection, setDoc, doc } from "firebase/firestore";

async function seedSchools() {
  const batch = ZIM_UNIVERSITIES.map(async (school) => {
    const ref = doc(collection(db, "schools"), school.id);
    await setDoc(ref, school, { merge: true });
    console.log(`Seeded: ${school.name}`);
  });

  await Promise.all(batch);
  console.log("All schools seeded!");
}

seedSchools().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
}); 