import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { UniversityTheme } from "@/types"

export async function getUniversityTheme(campusId: string) {
  const themesQuery = query(
    collection(db, 'university_themes'),
    where('campus_id', '==', campusId)
  );
  
  const snapshot = await getDocs(themesQuery);
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getDefaultTheme() {
  const defaultThemeRef = doc(db, 'themes', 'default');
  const defaultThemeSnap = await getDoc(defaultThemeRef);
  
  if (!defaultThemeSnap.exists()) {
    return null;
  }
  
  return { id: defaultThemeSnap.id, ...defaultThemeSnap.data() };
}
