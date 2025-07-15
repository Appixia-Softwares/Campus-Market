import { NextRequest, NextResponse } from 'next/server';
import { markAllNotificationsAsRead } from '@/lib/api/notifications.server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const result = await markAllNotificationsAsRead(userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || 'Unknown error' }, { status: 500 });
  }
} 