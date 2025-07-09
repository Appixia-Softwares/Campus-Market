import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Campus } from "@/types"

export async function getCampuses() {
  const campusesQuery = query(
    collection(db, 'campuses'),
    orderBy('name')
  );

  const snapshot = await getDocs(campusesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getCampusById(id: string) {
  const campusRef = doc(db, 'campuses', id);
  const campusSnap = await getDoc(campusRef);
  
  if (!campusSnap.exists()) {
    return null;
  }
  
  return { id: campusSnap.id, ...campusSnap.data() };
}
