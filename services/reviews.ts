import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Review } from "@/types"

export async function getReviews(userId: string) {
  const reviewsQuery = query(
    collection(db, 'reviews'),
    where('reviewee_id', '==', userId),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(reviewsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createReview(review: Omit<Review, 'id'>) {
  const reviewData = {
    ...review,
    created_at: new Date(),
    updated_at: new Date()
  };
  const docRef = await addDoc(collection(db, 'reviews'), reviewData);
  return { id: docRef.id, ...reviewData };
}

export async function deleteReview(id: string) {
  const reviewRef = doc(db, 'reviews', id);
  await deleteDoc(reviewRef);
}

export async function getAverageRating(userId: string) {
  const reviewsQuery = query(
    collection(db, 'reviews'),
    where('reviewee_id', '==', userId)
  );
  const snapshot = await getDocs(reviewsQuery);
  const reviews = snapshot.docs.map(doc => doc.data());
  if (reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
}

export async function getReviewsForAccommodation(accommodationId: string | number) {
  const reviewsQuery = query(
    collection(db, 'accommodation_reviews'),
    where('accommodation_id', '==', accommodationId),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(reviewsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createAccommodationReview(
  review: Omit<Review, 'id' | 'created_at' | 'updated_at'> & { reviewer_id: string, accommodation_id: string, landlord_id: string }
) {
  if (review.reviewer_id === review.landlord_id) {
    throw new Error('You cannot review your own property.');
  }
  const bookingsQuery = query(
    collection(db, 'accommodation_bookings'),
    where('propertyId', '==', review.accommodation_id),
    where('customerId', '==', review.reviewer_id),
    where('status', '==', 'completed')
  );
  const bookingsSnap = await getDocs(bookingsQuery);
  if (bookingsSnap.empty) {
    throw new Error('You can only review after completing a stay.');
  }
  const reviewData = {
    ...review,
    created_at: new Date(),
    updated_at: new Date()
  };
  const docRef = await addDoc(collection(db, 'accommodation_reviews'), reviewData);
  return { id: docRef.id, ...reviewData };
}
