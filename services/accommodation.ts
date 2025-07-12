import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore'

export async function getRecentAccommodations(campusId?: string | number) {
  try {
    let q = query(
      collection(db, 'rooms'),
      where('is_available', '==', true),
      orderBy('createdAt', 'desc'), // Use 'createdAt' as in your Firestore
    );
    if (campusId) {
      q = query(q, where('campus', '==', campusId)); // Use 'campus' as in your Firestore
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
  minPrice,
  maxPrice,
  verifiedOnly,
  amenities,
  sortBy,
}: {
  typeId?: string | number;
  searchQuery?: string;
  campusId?: string | number;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  amenities?: string[];
  sortBy?: string;
}) {
  try {
    let orderField = 'createdAt'; // Use 'createdAt' as in your Firestore
    let orderDirection: 'asc' | 'desc' = 'desc';
    if (sortBy === 'oldest') {
      orderDirection = 'asc';
    } else if (sortBy === 'price_asc') {
      orderField = 'price';
      orderDirection = 'asc';
    } else if (sortBy === 'price_desc') {
      orderField = 'price';
      orderDirection = 'desc';
    }
    let q = query(
      collection(db, 'rooms'),
      where('is_available', '==', true),
      orderBy(orderField, orderDirection),
    );
    if (typeId) {
      q = query(q, where('propertyType', '==', typeId)); // Use 'propertyType' as in your Firestore
    }
    if (campusId) {
      q = query(q, where('campus', '==', campusId)); // Use 'campus' as in your Firestore
    }
    if (minPrice !== undefined) {
      q = query(q, where('price', '>=', minPrice));
    }
    if (maxPrice !== undefined) {
      q = query(q, where('price', '<=', maxPrice));
    }
    if (verifiedOnly) {
      q = query(q, where('verified', '==', true));
    }
    // Firestore doesn't support OR queries easily, so filter after fetch
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      results = results.filter(
        (item: any) =>
          item.title?.toLowerCase().includes(sq) ||
          item.description?.toLowerCase().includes(sq)
      );
    }
    // Amenities filtering (client-side for now)
    if (amenities && amenities.length) {
      results = results.filter((item: any) =>
        amenities.every((a) => (item.amenities || []).includes(a))
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
    const ref = doc(db, 'rooms', String(id));
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
    const docRef = await addDoc(collection(db, 'rooms'), {
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
    const ref = doc(db, 'rooms', String(id));
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
    const ref = doc(db, 'rooms', String(id));
    await deleteDoc(ref);
    return true;
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    throw error;
  }
}

// --- MIGRATION UTILITY ---
// Run this function manually (e.g. from a script or dev tool) to patch all 'rooms' documents with required fields for querying.
export async function migrateRoomsCollection() {
  const snapshot = await getDocs(collection(db, 'rooms'))
  const now = new Date()
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()
    const updates: any = {}
    if (typeof data.is_available !== 'boolean') updates.is_available = true
    if (!data.created_at) updates.created_at = Timestamp.fromDate(now)
    if (typeof data.price !== 'number') updates.price = 0
    if (!('type_id' in data)) updates.type_id = ''
    if (!('campus_id' in data)) updates.campus_id = ''
    if (typeof data.verified !== 'boolean') updates.verified = false
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'rooms', docSnap.id), updates)
      console.log(`Migrated room ${docSnap.id}:`, updates)
    }
  }
  console.log('Migration complete.')
}
