import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

export async function getAllReports() {
  const snapshot = await getDocs(collection(db, 'reports'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Real-time reports listener
export function getAllReportsRealtime(callback: (reports: any[]) => void) {
  return onSnapshot(collection(db, 'reports'), (snapshot) => {
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(reports);
  });
} 