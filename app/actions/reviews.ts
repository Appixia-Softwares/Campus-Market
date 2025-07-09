import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { createAction } from '@/lib/action-handler';

export const getReviews = createAction(async (params: {
  revieweeId?: string;
  reviewerId?: string;
}) => {
  const { revieweeId, reviewerId } = params;

  if (!revieweeId && !reviewerId) {
    throw new Error('Either revieweeId or reviewerId is required');
  }

  let reviewsQuery;
  if (revieweeId) {
    reviewsQuery = query(
      collection(db, 'reviews'),
      where('reviewee_id', '==', revieweeId),
      orderBy('created_at', 'desc')
    );
  } else {
    reviewsQuery = query(
      collection(db, 'reviews'),
      where('reviewer_id', '==', reviewerId),
      orderBy('created_at', 'desc')
    );
  }

  const snapshot = await getDocs(reviewsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

export const createReview = createAction(async (reviewData: any) => {
  const data = {
    ...reviewData,
    created_at: new Date(),
    updated_at: new Date()
  };

  const docRef = await addDoc(collection(db, 'reviews'), data);
  return { id: docRef.id, ...data };
});

export const updateReview = createAction(async (id: string, updates: any) => {
  const reviewRef = doc(db, 'reviews', id);
  const data = {
    ...updates,
    updated_at: new Date()
  };
  
  await updateDoc(reviewRef, data);
  return { id, ...data };
});

export const deleteReview = createAction(async (id: string) => {
  const reviewRef = doc(db, 'reviews', id);
  await deleteDoc(reviewRef);
  return { success: true };
}); 