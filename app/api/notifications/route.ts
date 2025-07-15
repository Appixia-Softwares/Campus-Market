import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from '@/lib/api/notifications.server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ data: [], error: 'Missing userId' }, { status: 400 });
  const { data, error } = await getNotifications(userId);
  return NextResponse.json({ data, error });
}

export async function POST(req: NextRequest) {
  try {
    const { notification } = await req.json();
    const result = await createNotification(notification);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || 'Unknown error' }, { status: 500 });
  }
} 