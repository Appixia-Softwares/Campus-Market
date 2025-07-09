import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { createAction } from '@/lib/action-handler';

export const getMessages = createAction(async (params: {
  conversationId?: string;
  userId?: string;
}) => {
  const { conversationId, userId } = params;

  if (!conversationId && !userId) {
    throw new Error('Either conversationId or userId is required');
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
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

export const createMessage = createAction(async (messageData: any) => {
  const data = {
    ...messageData,
    created_at: new Date(),
    updated_at: new Date()
  };

  const docRef = await addDoc(collection(db, 'messages'), data);
  return { id: docRef.id, ...data };
});

export const updateMessage = createAction(async (id: string, updates: any) => {
  const messageRef = doc(db, 'messages', id);
  const data = {
    ...updates,
    updated_at: new Date()
  };
  
  await updateDoc(messageRef, data);
  return { id, ...data };
});

export const deleteMessage = createAction(async (id: string) => {
  const messageRef = doc(db, 'messages', id);
  await deleteDoc(messageRef);
  return { success: true };
}); 