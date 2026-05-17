import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: true, unreadMessages: 0, unreadNotifications: 0 });
    }

    const { id: userId } = session.user;

    // Fetch unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    // Fetch unread notifications count
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      unreadMessages,
      unreadNotifications
    });
  } catch (error: any) {
    console.error('Unread counts GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
