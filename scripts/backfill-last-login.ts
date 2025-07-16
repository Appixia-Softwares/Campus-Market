import { getFirestore, collection, getDocs, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../lib/firebase';

// Initialize Firebase app if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function backfillLastLogin() {
  const usersCol = collection(db, 'users');
  const usersSnap = await getDocs(usersCol);
  let updated = 0;
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (!data.last_login) {
      let lastLogin;
      if (data.created_at) {
        if (typeof data.created_at === 'string') {
          // ISO string
          const d = new Date(data.created_at);
          lastLogin = isNaN(d.getTime()) ? serverTimestamp() : Timestamp.fromDate(d);
        } else if (data.created_at.toDate) {
          // Firestore Timestamp
          lastLogin = data.created_at;
        } else if (data.created_at instanceof Date) {
          lastLogin = Timestamp.fromDate(data.created_at);
        } else {
          lastLogin = serverTimestamp();
        }
      } else {
        lastLogin = serverTimestamp();
      }
      await updateDoc(doc(db, 'users', userDoc.id), {
        last_login: lastLogin,
      });
      updated++;
      console.log(`Updated last_login for user ${userDoc.id}`);
    }
  }
  console.log(`Backfill complete. Updated ${updated} users.`);
}

backfillLastLogin().catch((err) => {
  console.error('Error during backfill:', err);
  process.exit(1);
}); 