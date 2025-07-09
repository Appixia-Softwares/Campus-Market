import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import type { ActivityItem } from "@/types"

export async function getActivityFeed(userId: string) {
  const activityQuery = query(
    collection(db, 'activity_feed'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  );

  const snapshot = await getDocs(activityQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addActivityItem(item: Omit<ActivityItem, 'id'>) {
  const itemData = {
    ...item,
    created_at: new Date()
  };

  const docRef = await addDoc(collection(db, 'activity_feed'), itemData);
  return { id: docRef.id, ...itemData };
}
