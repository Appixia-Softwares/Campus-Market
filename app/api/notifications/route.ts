import { NextRequest, NextResponse } from 'next/server';
import { createNotification, getNotifications } from '@/lib/api/notifications';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  if (!adminDb || !adminMessaging) {
    return new Response('Notifications are temporarily unavailable.', { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ data: [], error: 'Missing userId' }, { status: 400 });
  const { data, error } = await getNotifications(userId);
  return NextResponse.json({ data, error });
}

export async function POST(req: NextRequest) {
  if (!adminDb || !adminMessaging) {
    return new Response('Notifications are temporarily unavailable.', { status: 503 });
  }
  try {
    const { notification } = await req.json();
    const result = await createNotification(notification);

    // Push notification logic (server-side only)
    if (notification.userId === null) {
      // Broadcast: send to all users
      const usersSnapshot = await adminDb.collection('users').get();
      const userIds = usersSnapshot.docs.map(doc => doc.id);
      await Promise.all(userIds.map(async (userId) => {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const fcmToken = userDoc.get('fcmToken');
        if (!fcmToken) return;
        await adminMessaging.send({
          token: fcmToken,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: { link: notification.link || '' },
        });
      }));
    } else if (notification.userId) {
      // Single user
      const userDoc = await adminDb.collection('users').doc(notification.userId).get();
      const fcmToken = userDoc.get('fcmToken');
      if (fcmToken) {
        await adminMessaging.send({
          token: fcmToken,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: { link: notification.link || '' },
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || 'Unknown error' }, { status: 500 });
  }
} 