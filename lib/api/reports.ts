import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getAllReports() {
  const snapshot = await getDocs(collection(db, 'reports'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} 