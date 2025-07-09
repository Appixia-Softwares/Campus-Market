import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Favorite } from "@/types"

export async function getFavorites(userId: string) {
  const favoritesQuery = query(
    collection(db, 'favorites'),
    where('user_id', '==', userId)
  );

  const snapshot = await getDocs(favoritesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addFavorite(favorite: Omit<Favorite, 'id'>) {
  const favoriteData = {
    ...favorite,
    created_at: new Date()
  };

  const docRef = await addDoc(collection(db, 'favorites'), favoriteData);
  return { id: docRef.id, ...favoriteData };
}

export async function removeFavorite(id: string) {
  const favoriteRef = doc(db, 'favorites', id);
  await deleteDoc(favoriteRef);
}

export async function isFavorite(userId: string, listingId: string) {
  const favoritesQuery = query(
    collection(db, 'favorites'),
    where('user_id', '==', userId),
    where('listing_id', '==', listingId)
  );

  const snapshot = await getDocs(favoritesQuery);
  return !snapshot.empty;
}
