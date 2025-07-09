import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Listing, ListingCategory } from "@/types"

export async function getRecentListings(campusId?: string | number) {
  try {
    let query = query(
      collection(db, 'listings'),
      where('is_sold', '==', false),
      orderBy('created_at', 'desc')
    );

    if (campusId) {
      query = query(query, where('campus_id', '==', campusId));
    }

    const snapshot = await getDocs(query);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching recent listings:", error)
    return []
  }
}

export async function getListings(filters?: {
  category?: string;
  university?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  let listingsQuery = query(
    collection(db, 'listings'),
    where('is_sold', '==', false),
    orderBy('created_at', 'desc')
  );

  if (filters?.category) {
    listingsQuery = query(listingsQuery, where('category_id', '==', filters.category));
    }

  if (filters?.university) {
    listingsQuery = query(listingsQuery, where('university_id', '==', filters.university));
    }

  if (filters?.minPrice) {
    listingsQuery = query(listingsQuery, where('price', '>=', filters.minPrice));
  }

  if (filters?.maxPrice) {
    listingsQuery = query(listingsQuery, where('price', '<=', filters.maxPrice));
  }

  const snapshot = await getDocs(listingsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getListingById(id: string | number) {
  try {
    const snapshot = await getDocs(doc(db, 'listings', id));
    const data = snapshot.docs[0].data();
    return { id, ...data };
  } catch (error) {
    console.error("Error fetching listing:", error)
    return null
  }
}

export async function getListingCategories() {
  try {
    const snapshot = await getDocs(collection(db, 'listing_categories'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching listing categories:", error)
    return []
  }
}

export async function createListing(listing: any) {
  const docRef = await addDoc(collection(db, 'listings'), {
    ...listing,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  const snapshot = await getDocs(docRef);
  return { id: docRef.id, ...snapshot.docs[0].data() };
}

export async function updateListing(id: string, updates: any) {
  const listingRef = doc(db, 'listings', id);
  await updateDoc(listingRef, {
    ...updates,
    updated_at: new Date()
  });
  
  const snapshot = await getDocs(listingRef);
  return { id, ...snapshot.docs[0].data() };
}

export async function deleteListing(id: string) {
  const listingRef = doc(db, 'listings', id);
  await deleteDoc(listingRef);
}
