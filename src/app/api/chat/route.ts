import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = session.user;
    const { searchParams } = request.nextUrl;
    const receiverId = searchParams.get('receiverId');
    const channelId = searchParams.get('channelId');

    let where: any = {};

    if (channelId) {
      // Messages belonging to a group or public/private channel
      where.channelId = channelId;
    } else if (receiverId && receiverId !== 'general') {
      // Direct messaging between two specific users
      where.channelId = null;
      where.OR = [
        { senderId: userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: userId }
      ];

      // Mark incoming messages from this contact to me as read
      await prisma.message.updateMany({
        where: {
          senderId: receiverId,
          receiverId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } else {
      // General chat lobby (receiverId is null and channelId is null)
      where.receiverId = null;
      where.channelId = null;
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100 // cap at latest 100 messages for efficiency
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Chat messages GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = session.user;
    const body = await request.json();
    const { content, receiverId, channelId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const mappedReceiverId = channelId ? null : ((receiverId === 'general' || !receiverId) ? null : receiverId);

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: mappedReceiverId,
        channelId: channelId || null,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create notification entries to instantly sync with notification centers of recipients
    try {
      if (mappedReceiverId) {
        // Direct Message recipient
        await prisma.notification.create({
          data: {
            userId: mappedReceiverId,
            title: `New Message from ${session.user.name || 'Coworker'}`,
            message: content.trim().length > 60 ? `${content.trim().slice(0, 60)}...` : content.trim(),
            type: 'INFO',
            isRead: false
          }
        });
      } else if (channelId) {
        // Channel Message members
        const channel = await prisma.channel.findUnique({
          where: { id: channelId }
        });
        if (channel) {
          let targetUserIds: string[] = [];
          if (channel.isPrivate) {
            targetUserIds = channel.memberIds.filter((id: string) => id !== userId);
          } else {
            const companyUsers = await prisma.user.findMany({
              where: {
                companyId: session.user.companyId,
                id: { not: userId }
              },
              select: { id: true }
            });
            targetUserIds = companyUsers.map((u: { id: string }) => u.id);
          }

          if (targetUserIds.length > 0) {
            await prisma.notification.createMany({
              data: targetUserIds.map((recipientId: string) => ({
                userId: recipientId,
                title: `#${channel.name}: New message from ${session.user.name || 'Staff'}`,
                message: content.trim().length > 60 ? `${content.trim().slice(0, 60)}...` : content.trim(),
                type: 'INFO',
                isRead: false
              }))
            });
          }
        }
      }
    } catch (notificationErr) {
      console.error('Failed to auto-create notifications for sent message:', notificationErr);
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Chat message POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
