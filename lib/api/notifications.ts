import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import type { Notification } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function getNotifications(userId: string): Promise<{ data: Notification[]; error: any }> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('user_id', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    return { data, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function markNotificationAsRead(id: string): Promise<{ data: null; error: any }> {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, id);
    await updateDoc(notifRef, { read: true });
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ data: null; error: any }> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('user_id', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<{ data: Notification | null; error: any }> {
  try {
    const notifData = {
      ...notification,
      createdAt: serverTimestamp(),
      read: false,
    };
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notifData);
    return { data: { id: docRef.id, ...notifData } as unknown as Notification, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteNotification(id: string): Promise<{ data: null; error: any }> {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('user_id', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getCountFromServer(q);
    return { count: snapshot.data().count, error: null };
  } catch (error) {
    return { count: 0, error };
  }
}
