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

export async function getReviewsForListing(listingId: string | number) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as (Review & { reviewer: any })[]
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

export async function getReviewsForAccommodation(accommodationId: string | number) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:reviewer_id(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("accommodation_id", accommodationId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data as (Review & { reviewer: any })[]
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

export async function updateReview(id: string | number, updates: Partial<Review>) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data as Review
  } catch (error) {
    console.error("Error updating review:", error)
    throw error
  }
}

export async function getUserRating(userId: string) {
  try {
    const { data, error, count } = await supabase
      .from("reviews")
      .select("rating", { count: "exact" })
      .eq("reviewee_id", userId)

    if (error) throw error

    if (!data || data.length === 0) {
      return { rating: 0, count: 0 }
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / data.length

    return { rating: averageRating, count: count || 0 }
  } catch (error) {
    console.error("Error fetching user rating:", error)
    return { rating: 0, count: 0 }
  }
}
