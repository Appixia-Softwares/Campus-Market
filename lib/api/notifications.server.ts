import { adminDb } from '../firebase-admin';
import type { Notification } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function getNotifications(userId: string): Promise<{ data: Notification[]; error: any }> {
  try {
    const snapshot = await adminDb
      .collection(NOTIFICATIONS_COLLECTION)
      .where('user_id', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    return { data, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function markNotificationAsRead(id: string): Promise<{ data: null; error: any }> {
  try {
    await adminDb.collection(NOTIFICATIONS_COLLECTION).doc(id).update({ read: true });
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ data: null; error: any }> {
  try {
    const snapshot = await adminDb
      .collection(NOTIFICATIONS_COLLECTION)
      .where('user_id', '==', userId)
      .where('read', '==', false)
      .get();
    const batch = adminDb.batch();
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
    if (notification.userId === null) {
      // Broadcast: send to all users
      const usersSnapshot = await adminDb.collection('users').get();
      const userIds = usersSnapshot.docs.map(doc => doc.id);
      const notifData = {
        ...notification,
        createdAt: new Date(),
        read: false,
      };
      // Create a notification for each user
      await Promise.all(userIds.map(async (userId) => {
        await adminDb.collection(NOTIFICATIONS_COLLECTION).add({ ...notifData, userId });
        // Optionally: send push notification here if needed
      }));
      return { data: null, error: null };
    }
    const notifData = {
      ...notification,
      createdAt: new Date(),
      read: false,
    };
    const docRef = await adminDb.collection(NOTIFICATIONS_COLLECTION).add(notifData);
    // Optionally: send push notification here if needed
    return { data: { id: docRef.id, ...notifData } as Notification, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteNotification(id: string): Promise<{ data: null; error: any }> {
  try {
    await adminDb.collection(NOTIFICATIONS_COLLECTION).doc(id).delete();
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error: any }> {
  try {
    const snapshot = await adminDb
      .collection(NOTIFICATIONS_COLLECTION)
      .where('user_id', '==', userId)
      .where('read', '==', false)
      .get();
    return { count: snapshot.size, error: null };
  } catch (error) {
    return { count: 0, error };
  }
} 