import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getAllOrders() {
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} 