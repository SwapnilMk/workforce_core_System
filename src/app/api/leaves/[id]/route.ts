import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { LeaveStatus } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: approverId } = session.user;

    // RBAC: Only Managers, HR, or Admins can approve/reject leaves
    if (role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden: Employees cannot approve leaves' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, remarks } = body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid leave status' }, { status: 400 });
    }

    // Find the leave request first
    const leaveRequest = await prisma.leave.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const targetCompanyId = leaveRequest.companyId || leaveRequest.user?.companyId;
    const { validateCompanyAccess } = require('@/lib/tenant');
    if (!validateCompanyAccess(session.user, targetCompanyId)) {
      return NextResponse.json({ error: 'Access denied: Tenant mismatch' }, { status: 403 });
    }

    // Check manager's permission (Manager can only approve team leaves)
    if (role === 'MANAGER') {
      const manager = await prisma.user.findUnique({
        where: { id: approverId },
        select: { departmentId: true }
      });
      if (!manager?.departmentId || manager.departmentId !== leaveRequest.user.departmentId) {
        return NextResponse.json({ error: 'Forbidden: Managers can only approve leaves for their own department team.' }, { status: 403 });
      }
    }

    // Update leave request - removing remarks as it is not in schema.prisma
    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: status as LeaveStatus,
        approvedBy: approverId
      }
    });

    // Notify employee of the decision
    await prisma.notification.create({
      data: {
        userId: leaveRequest.userId,
        companyId: targetCompanyId || null,
        title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: `Your leave request from ${leaveRequest.startDate.toLocaleDateString()} has been ${status.toLowerCase()} by ${session.user.name}. ${remarks ? 'Remarks: ' + remarks : ''}`,
        type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Leave request has been successfully ${status.toLowerCase()}`,
      leave: updatedLeave
    });
  } catch (error: any) {
    console.error('Leave action PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
