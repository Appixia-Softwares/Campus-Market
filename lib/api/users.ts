import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { UserWithMeta } from '@/app/admin/page';

export async function getAllUsers(): Promise<UserWithMeta[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserWithMeta[];
}

// Real-time users listener
export function getAllUsersRealtime(callback: (users: UserWithMeta[]) => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserWithMeta[];
    callback(users);
  });
}

// Update user fields
export async function updateUser(userId: string, updates: Partial<UserWithMeta>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
}

// Delete user
export async function deleteUser(userId: string) {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
} 