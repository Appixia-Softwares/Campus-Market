import { NextRequest, NextResponse } from 'next/server';
import { deleteNotification } from '@/lib/api/notifications.server';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    const result = await deleteNotification(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || 'Unknown error' }, { status: 500 });
  }
} 