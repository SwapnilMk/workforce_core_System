import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId, companyId } = session.user;

    const users = await prisma.user.findMany({
      where: {
        companyId,
        id: { not: userId } // exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePicture: true,
        department: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Compute active unread counts for each contact in parallel
    const usersWithUnreads = await Promise.all(
      users.map(async (u) => {
        const unreadCount = await prisma.message.count({
          where: {
            senderId: u.id,
            receiverId: userId,
            isRead: false
          }
        });
        return {
          ...u,
          unreadCount
        };
      })
    );

    return NextResponse.json({ success: true, users: usersWithUnreads });
  } catch (error: any) {
    console.error('Chat users GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
