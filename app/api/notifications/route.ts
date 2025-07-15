import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/api/notifications';

export async function POST(req: NextRequest) {
  try {
    const { notification } = await req.json();
    const result = await createNotification(notification);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || 'Unknown error' }, { status: 500 });
  }
} 