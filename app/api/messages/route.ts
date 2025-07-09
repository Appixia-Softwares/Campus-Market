import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { handleFirebaseError } from '@/lib/firebase-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId && !userId) {
      return NextResponse.json(
        { error: 'Either conversationId or userId is required' },
        { status: 400 }
      );
    }

    let messagesQuery;
    if (conversationId) {
      messagesQuery = query(
        collection(db, 'messages'),
        where('conversation_id', '==', conversationId),
        orderBy('created_at', 'asc')
      );
    } else {
      messagesQuery = query(
        collection(db, 'messages'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
    }

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(messages);
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
    const message = await request.json();
    const messageData = {
      ...message,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    return NextResponse.json({ id: docRef.id, ...messageData });
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
    const messageRef = doc(db, 'messages', id);
    
    await updateDoc(messageRef, {
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
    const messageRef = doc(db, 'messages', id);
    await deleteDoc(messageRef);
    return NextResponse.json({ success: true });
  } catch (error) {
    const firebaseError = handleFirebaseError(error);
    return NextResponse.json(
      { error: firebaseError.message },
      { status: 500 }
    );
  }
} 