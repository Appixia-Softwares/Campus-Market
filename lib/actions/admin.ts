import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from '../api/notifications';

/**
 * Send an admin announcement notification to all users.
 * @param title Notification title
 * @param body Notification body
 * @param link Optional link for the notification
 */
export async function sendAdminAnnouncement(title: string, body: string, link?: string) {
  // Fetch all user IDs from the users collection
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const userIds = usersSnapshot.docs.map(doc => doc.id);

  // Send notification to each user
  const promises = userIds.map(userId =>
    createNotification({
      userId,
      type: 'admin',
      title,
      body,
      link,
      read: false,
      extraData: {},
    })
  );
  await Promise.all(promises);
  return { success: true, count: userIds.length };
}

// Firestore User and Product types for reminders
interface FirestoreUser {
  id: string;
  email?: string;
  full_name?: string;
  university_id?: string;
  phone?: string;
  bio?: string;
}
interface FirestoreProduct {
  id: string;
  user_id?: string;
}

/**
 * Send reminders to users with incomplete profiles or no product listed.
 * This can be run as a scheduled job or manually.
 */
export async function sendReminders() {
  // Fetch all users
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser));

  // Fetch all products
  const productsSnapshot = await getDocs(collection(db, 'products'));
  const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreProduct));

  // Build a set of userIds who have at least one product
  const usersWithProducts = new Set(products.map(p => p.user_id));

  const notifications = [];

  for (const user of users) {
    // Incomplete profile check (customize as needed)
    const incompleteProfile = !user.full_name || !user.email || !user.university_id || !user.phone || !user.bio;
    if (incompleteProfile) {
      notifications.push(createNotification({
        userId: user.id,
        type: 'reminder',
        title: 'Complete Your Profile',
        body: 'Build trust and unlock all features by completing your profile.',
        link: '/profile',
        read: false,
        extraData: {},
      }));
    }
    // No product listed check
    if (!usersWithProducts.has(user.id)) {
      notifications.push(createNotification({
        userId: user.id,
        type: 'reminder',
        title: 'List Your First Product',
        body: 'Start selling by listing your first product on Campus Market!',
        link: '/marketplace/sell',
        read: false,
        extraData: {},
      }));
    }
  }

  await Promise.all(notifications);
  return { success: true, count: notifications.length };
} 