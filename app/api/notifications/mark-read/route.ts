import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/lib/api/notifications';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    const result = await markNotificationAsRead(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || 'Unknown error' }, { status: 500 });
  }
} 