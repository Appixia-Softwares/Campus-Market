"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where, deleteDoc } from "firebase/firestore"

export type ListingType = 'product' | 'accommodation' | 'service'

interface DeleteListingOptions {
  listingId: string
  listingType: ListingType
  userId: string
}

export async function deleteListingAction({ listingId, listingType, userId }: DeleteListingOptions) {
  try {
    // Get the listing data first to verify ownership and clean up related data
    const listingRef = doc(db, `${listingType}s`, listingId);
    const listingSnap = await getDoc(listingRef);
    
    if (!listingSnap.exists()) {
      return { success: false, error: `${listingType} not found` };
    }

    const listingData = listingSnap.data();
    
    // Verify ownership
    const ownerId = listingData.seller_id || listingData.seller?.id || listingData.user_id;
    if (ownerId !== userId) {
      return { success: false, error: "You don't have permission to delete this listing" };
    }

    // Delete related images
    const imagesCollection = `${listingType}_images`;
    const imagesQuery = query(
      collection(db, imagesCollection),
      where(`${listingType}_id`, '==', listingId)
    );
    const imagesSnapshot = await getDocs(imagesQuery);
    
    const imageDeletePromises = imagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(imageDeletePromises);

    // Delete favorites for this listing
    const favoritesQuery = query(
      collection(db, 'user_favorites'),
      where('item_id', '==', listingId),
      where('type', '==', listingType)
    );
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    const favoritesDeletePromises = favoritesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(favoritesDeletePromises);

    // Delete notifications related to this listing
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('extraData.listingId', '==', listingId)
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    const notificationsDeletePromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(notificationsDeletePromises);

    // Delete reviews for this listing
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('listing_id', '==', listingId),
      where('listing_type', '==', listingType)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    const reviewsDeletePromises = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(reviewsDeletePromises);

    // Delete bookings (for accommodations)
    if (listingType === 'accommodation') {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('accommodation_id', '==', listingId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      const bookingsDeletePromises = bookingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(bookingsDeletePromises);
    }

    // Delete messages related to this listing
    const messagesQuery = query(
      collection(db, 'messages'),
      where('listing_id', '==', listingId),
      where('listing_type', '==', listingType)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const messagesDeletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(messagesDeletePromises);

    // Delete the listing itself
    await deleteDoc(listingRef);

    // Revalidate relevant paths
    revalidatePath(`/${listingType === 'product' ? 'marketplace' : listingType}`);
    revalidatePath(`/${listingType === 'product' ? 'marketplace' : listingType}/my-listings`);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting ${listingType}:`, error);
    return { success: false, error: `Failed to delete ${listingType}` };
  }
}

// Convenience functions for specific listing types
export async function deleteProductListingAction(listingId: string, userId: string) {
  return deleteListingAction({ listingId, listingType: 'product', userId });
}

export async function deleteAccommodationListingAction(listingId: string, userId: string) {
  return deleteListingAction({ listingId, listingType: 'accommodation', userId });
}

export async function deleteServiceListingAction(listingId: string, userId: string) {
  return deleteListingAction({ listingId, listingType: 'service', userId });
} 