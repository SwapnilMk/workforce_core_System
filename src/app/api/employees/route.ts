import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 10);
    const search = searchParams.get('search') ?? undefined;
    const rolesParam = searchParams.get('role') ?? undefined;
    const departmentId = searchParams.get('departmentId') ?? undefined;

    const { getTenantFilter } = require('@/lib/tenant');
    const where: any = {
      ...getTenantFilter(session.user),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (rolesParam) {
      const rolesArray = rolesParam.split(',').map((r) => r.toUpperCase().replace(' ', '_'));
      const prismaRoles: UserRole[] = [];
      rolesArray.forEach((r) => {
        if (r === 'SUPER_ADMIN') prismaRoles.push(UserRole.SUPER_ADMIN);
        else if (r === 'ADMIN') prismaRoles.push(UserRole.ADMIN);
        else if (r === 'HR') prismaRoles.push(UserRole.HR);
        else if (r === 'MANAGER') prismaRoles.push(UserRole.MANAGER);
        else if (r === 'EMPLOYEE') prismaRoles.push(UserRole.EMPLOYEE);
      });
      if (prismaRoles.length > 0) {
        where.role = { in: prismaRoles };
      }
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const totalEmployees = await prisma.user.count({ where });
    const offset = (page - 1) * limit;

    const dbUsers = await prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        department: { select: { id: true, name: true } },
        employeeProfile: true,
        payrollProfile: true,
        attendanceProfile: true,
        documents: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      total: totalEmployees,
      page,
      limit,
      employees: dbUsers
    });

  } catch (error: any) {
    console.error('API GET Employees list error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
