import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, name, type, url, size, expiryDate } = body;

    if (!userId || !name || !url) {
      return NextResponse.json({ error: 'Missing required document parameters' }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        userId,
        name,
        type: type || 'PDF',
        url,
        size: Number(size || 0),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'VERIFIED'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Document uploaded and logged securely',
      document
    });
  } catch (error: any) {
    console.error('API Document POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const documents = await prisma.document.findMany({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      documents
    });
  } catch (error: any) {
    console.error('API Documents GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
