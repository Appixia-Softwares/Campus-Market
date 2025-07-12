import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

export async function getRecentAccommodations(campusId?: string | number) {
  try {
    let q = query(
      collection(db, 'accommodations'),
      where('is_available', '==', true),
      orderBy('created_at', 'desc'),
    );
    if (campusId) {
      q = query(q, where('campus_id', '==', campusId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching recent accommodations:', error);
    return [];
  }
}

export async function getAccommodations({
  typeId,
  searchQuery,
  campusId,
}: {
  typeId?: string | number;
  searchQuery?: string;
  campusId?: string | number;
}) {
  try {
    let q = query(
      collection(db, 'accommodations'),
      where('is_available', '==', true),
      orderBy('created_at', 'desc'),
    );
    if (typeId) {
      q = query(q, where('type_id', '==', typeId));
    }
    if (campusId) {
      q = query(q, where('campus_id', '==', campusId));
    }
    // Firestore doesn't support OR queries easily, so filter after fetch
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      results = results.filter(
        (item: any) =>
          item.title?.toLowerCase().includes(sq) ||
          item.address?.toLowerCase().includes(sq)
      );
    }
    return results;
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return [];
  }
}

export async function getAccommodationById(id: string | number) {
  try {
    const ref = doc(db, 'accommodations', String(id));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    return null;
  }
}

export async function getAccommodationTypes() {
  try {
    const q = query(collection(db, 'accommodation_types'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching accommodation types:', error);
    return [];
  }
}

export async function createAccommodation(accommodation: any) {
  try {
    const docRef = await addDoc(collection(db, 'accommodations'), {
      ...accommodation,
      created_at: new Date(),
      updated_at: new Date(),
      is_available: true,
    });
    const snap = await getDoc(docRef);
    return { id: docRef.id, ...snap.data() };
  } catch (error) {
    console.error('Error creating accommodation:', error);
    throw error;
  }
}

export async function updateAccommodation(id: string | number, updates: any) {
  try {
    const ref = doc(db, 'accommodations', String(id));
    await updateDoc(ref, { ...updates, updated_at: new Date() });
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('Error updating accommodation:', error);
    throw error;
  }
}

export async function deleteAccommodation(id: string | number) {
  try {
    const ref = doc(db, 'accommodations', String(id));
    await deleteDoc(ref);
    return true;
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    throw error;
  }
}
