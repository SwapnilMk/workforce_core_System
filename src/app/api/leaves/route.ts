import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { LeaveStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId, companyId } = session.user;
    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');

    let where: any = {};
    if (statusParam) {
      where.status = statusParam.toUpperCase() as LeaveStatus;
    }

    // RBAC filtering
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
    } else if (role === 'HR' || role === 'SUPER_ADMIN' || role === 'ADMIN') {
      if (companyId) {
        where.user = { companyId };
      }
    }

    const dbLeaves = await prisma.leave.findMany({
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

    // Map leaves to include an approver placeholder/name if needed
    const leaves = dbLeaves.map(leave => ({
      ...leave,
      approver: leave.approvedBy ? { name: 'Admin/Manager' } : null
    }));

    return NextResponse.json({ success: true, leaves });
  } catch (error: any) {
    console.error('Leaves GET error:', error);
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
    const { startDate, endDate, type, reason } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required leave fields' }, { status: 400 });
    }

    // Create the leave request matching schema.prisma fields
    const leave = await prisma.leave.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || 'Casual',
        status: LeaveStatus.PENDING,
        reason
      }
    });

    // Create system notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Leave Request Submitted',
        message: `Your ${type || 'casual'} leave request for ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} is submitted and pending approval.`,
        type: 'INFO'
      }
    });

    return NextResponse.json({ success: true, message: 'Leave applied successfully', leave });
  } catch (error: any) {
    console.error('Leaves POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
