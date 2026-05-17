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
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;

    let where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;

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

    const payrolls = await prisma.payroll.findMany({
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
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    return NextResponse.json({ success: true, payrolls });
  } catch (error: any) {
    console.error('Payroll GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, companyId } = session.user;

    // Only HR and Admins can generate payrolls
    if (role !== 'HR' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only HR or Admins can generate payrolls.' }, { status: 403 });
    }

    const body = await request.json();
    const { month, year } = body;

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    // Fetch all active employees in this company
    const employees = await prisma.user.findMany({
      where: {
        companyId,
        role: { not: 'SUPER_ADMIN' } // skip Super Admin
      }
    });

    let generatedCount = 0;
    let skippedCount = 0;

    const results = [];

    for (const emp of employees) {
      // Check if payroll already exists
      const existing = await prisma.payroll.findFirst({
        where: {
          userId: emp.id,
          month,
          year
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Default structures if undefined
      const basic = emp.basicSalary ?? 30000;
      const hra = emp.hra ?? 12000;
      const allowances = emp.allowances ?? 5000;
      const pf = emp.pf ?? 3600;
      const esi = emp.esi ?? 975;
      const tax = emp.tax ?? 1500;
      const pt = emp.professionalTax ?? 200;

      // Net Salary = Earnings - Deductions
      const netSalary = Math.max(0, (basic + hra + allowances) - (pf + esi + tax + pt));

      const payroll = await prisma.payroll.create({
        data: {
          userId: emp.id,
          month,
          year,
          basicSalary: basic,
          hra,
          allowances,
          pf,
          esi,
          tax,
          professionalTax: pt,
          netSalary,
          status: 'PENDING'
        }
      });

      // Notify the employee
      await prisma.notification.create({
        data: {
          userId: emp.id,
          title: `Payslip Generated (${month}/${year})`,
          message: `Your salary slip for ${month}/${year} has been generated. Net Salary: INR ${netSalary.toLocaleString()}. Status: PENDING.`,
          type: 'INFO'
        }
      });

      generatedCount++;
      results.push(payroll);
    }

    return NextResponse.json({
      success: true,
      message: `Payroll generation completed successfully. Generated: ${generatedCount}, Skipped: ${skippedCount}`,
      count: generatedCount
    });
  } catch (error: any) {
    console.error('Payroll generation POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
