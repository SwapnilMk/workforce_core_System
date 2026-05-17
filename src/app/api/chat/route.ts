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

    let where: any = {};

    if (receiverId && receiverId !== 'general') {
      // Direct messaging between two specific users
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
      // General chat lobby (receiverId is null)
      where.receiverId = null;
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
    const { content, receiverId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const mappedReceiverId = (receiverId === 'general' || !receiverId) ? null : receiverId;

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: mappedReceiverId,
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

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Chat message POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
