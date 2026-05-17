import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId, companyId } = session.user;
    const { searchParams } = request.nextUrl;
    
    // Parse date filter
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    let startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    let endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);
      }
    }

    const { getTenantFilter } = require('@/lib/tenant');
    const where: any = {
      ...getTenantFilter(session.user),
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    };

    // RBAC logic
    if (role === 'EMPLOYEE') {
      where.userId = userId;
    } else if (role === 'MANAGER') {
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true }
      });
      if (manager?.departmentId) {
        where.user = { departmentId: manager.departmentId };
      } else {
        where.userId = userId;
      }
    }

    const jds = await prisma.dailyJd.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, jds });
  } catch (error: any) {
    console.error('Daily JD GET error:', error);
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
    const { tasksCompleted, tasksPending, hoursWorked, remarks } = body;

    if (!tasksCompleted || hoursWorked === undefined) {
      return NextResponse.json({ error: 'Tasks completed and hours worked are required' }, { status: 400 });
    }

    // Check if there is already a JD entry for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingJd = await prisma.dailyJd.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    let jd;
    if (existingJd) {
      // Update existing entry
      jd = await prisma.dailyJd.update({
        where: { id: existingJd.id },
        data: {
          tasksCompleted,
          tasksPending: tasksPending || '',
          hoursWorked: Number(hoursWorked),
          remarks: remarks || ''
        }
      });
    } else {
      // Create new entry
      jd = await prisma.dailyJd.create({
        data: {
          userId,
          companyId: session.user.companyId || null,
          date: new Date(),
          tasksCompleted,
          tasksPending: tasksPending || '',
          hoursWorked: Number(hoursWorked),
          remarks: remarks || ''
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily JD logged successfully for today.',
      jd
    });
  } catch (error: any) {
    console.error('Daily JD POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
