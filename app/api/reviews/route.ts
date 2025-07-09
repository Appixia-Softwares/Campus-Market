import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { handleFirebaseError } from '@/lib/firebase-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const revieweeId = searchParams.get('revieweeId');
    const reviewerId = searchParams.get('reviewerId');

    if (!revieweeId && !reviewerId) {
      return NextResponse.json(
        { error: 'Either revieweeId or reviewerId is required' },
        { status: 400 }
      );
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
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(reviews);
  } catch (error) {
    const firebaseError = handleFirebaseError(error);
    return NextResponse.json(
      { error: firebaseError.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const review = await request.json();
    const reviewData = {
      ...review,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await addDoc(collection(db, 'reviews'), reviewData);
    return NextResponse.json({ id: docRef.id, ...reviewData });
  } catch (error) {
    const firebaseError = handleFirebaseError(error);
    return NextResponse.json(
      { error: firebaseError.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    const reviewRef = doc(db, 'reviews', id);
    
    await updateDoc(reviewRef, {
      ...updates,
      updated_at: new Date()
    });

    return NextResponse.json({ id, ...updates });
  } catch (error) {
    const firebaseError = handleFirebaseError(error);
    return NextResponse.json(
      { error: firebaseError.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const reviewRef = doc(db, 'reviews', id);
    await deleteDoc(reviewRef);
    return NextResponse.json({ success: true });
  } catch (error) {
    const firebaseError = handleFirebaseError(error);
    return NextResponse.json(
      { error: firebaseError.message },
      { status: 500 }
    );
  }
} 