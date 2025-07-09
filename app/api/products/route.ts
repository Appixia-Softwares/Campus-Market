import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { handleFirebaseError } from '@/lib/firebase-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const university = searchParams.get('university');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    let productsQuery = query(
      collection(db, 'products'),
      where('is_sold', '==', false),
      orderBy('created_at', 'desc')
    );

    if (category) {
      productsQuery = query(productsQuery, where('category_id', '==', category));
    }

    if (university) {
      productsQuery = query(productsQuery, where('university_id', '==', university));
    }

    if (minPrice) {
      productsQuery = query(productsQuery, where('price', '>=', Number(minPrice)));
    }

    if (maxPrice) {
      productsQuery = query(productsQuery, where('price', '<=', Number(maxPrice)));
    }

    const snapshot = await getDocs(productsQuery);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(products);
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
    const product = await request.json();
    const productData = {
      ...product,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await addDoc(collection(db, 'products'), productData);
    return NextResponse.json({ id: docRef.id, ...productData });
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
    const productRef = doc(db, 'products', id);
    
    await updateDoc(productRef, {
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
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    return NextResponse.json({ success: true });
  } catch (error) {
    const firebaseError = handleFirebaseError(error);
    return NextResponse.json(
      { error: firebaseError.message },
      { status: 500 }
    );
  }
} 