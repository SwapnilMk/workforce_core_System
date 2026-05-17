import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = session.user;
    const body = await request.json();
    const { pushToken } = body;

    if (!pushToken) {
      return NextResponse.json({ error: 'Missing push token' }, { status: 400 });
    }

    // Update the pushToken on the user record in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken: pushToken
      } as any // Use 'as any' to bypass the locked query-engine type warning until build-time generator runs
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Mobile push token registered successfully' 
    });
  } catch (error: any) {
    console.error('Failed to register mobile push token:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
