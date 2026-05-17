import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = session.user;

    // Only HR and Admins can update/disburse payrolls
    if (role !== 'HR' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only HR or Admins can disburse salaries.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, transactionId } = body;

    if (!status || !['PAID', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payroll status' }, { status: 400 });
    }

    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id },
      data: {
        status: status,
        paidAt: status === 'PAID' ? new Date() : null
      }
    });

    // Notify employee of salary credit
    if (status === 'PAID') {
      await prisma.notification.create({
        data: {
          userId: existingPayroll.userId,
          title: 'Salary Credited',
          message: `Your salary for ${existingPayroll.month}/${existingPayroll.year} of INR ${existingPayroll.netSalary.toLocaleString()} has been credited successfully. Txn ID: ${transactionId || 'N/A'}.`,
          type: 'SUCCESS'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payroll has been successfully marked as ${status.toLowerCase()}`,
      payroll: updatedPayroll
    });
  } catch (error: any) {
    console.error('Payroll action PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
