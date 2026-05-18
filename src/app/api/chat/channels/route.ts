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

    // Fetch public channels OR private channels/groups where current user is a member
    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { isPrivate: false },
          { isPrivate: true, memberIds: { has: userId } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, channels });
  } catch (error: any) {
    console.error('Channels GET error:', error);
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
    const { name, isPrivate, memberIds = [] } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Channel name cannot be empty' }, { status: 400 });
    }

    // Ensure creator is in members
    const uniqueMemberIds = Array.from(new Set([userId, ...memberIds]));

    const channel = await prisma.channel.create({
      data: {
        name: name.trim(),
        isPrivate: !!isPrivate,
        memberIds: uniqueMemberIds,
        creatorId: userId
      }
    });

    return NextResponse.json({ success: true, channel });
  } catch (error: any) {
    console.error('Channel POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
