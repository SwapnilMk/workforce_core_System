import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { getSession } = require('@/lib/auth');
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role: requesterRole } = session.user;
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN' && requesterRole !== 'HR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { validateCompanyAccess } = require('@/lib/tenant');
    if (!validateCompanyAccess(session.user, existingUser.companyId)) {
      return NextResponse.json({ error: 'Access denied: Tenant mismatch' }, { status: 403 });
    }

    const body = await request.json();
    const { first_name, last_name, email, role, password } = body;

    let dbRole: UserRole = UserRole.EMPLOYEE;
    const rUpper = (role || '').toUpperCase().replace(' ', '_');
    if (rUpper === 'SUPER_ADMIN') dbRole = UserRole.SUPER_ADMIN;
    else if (rUpper === 'HR') dbRole = UserRole.HR;
    else if (rUpper === 'MANAGER') dbRole = UserRole.MANAGER;
    else if (rUpper === 'ADMIN') dbRole = UserRole.ADMIN;

    const updateData: any = {
      name: `${first_name} ${last_name}`,
      email,
      role: dbRole,
    };

    if (password && password.trim() !== '') {
      const { encryptPassword } = require('@/lib/crypto-password');
      updateData.password = encryptPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully in live database',
      user: {
        id: updatedUser.id,
        first_name,
        last_name,
        email: updatedUser.email,
        role,
        status: 'Active',
      }
    });
  } catch (error: any) {
    console.error('API User PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { getSession } = require('@/lib/auth');
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role: requesterRole } = session.user;
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN' && requesterRole !== 'HR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { validateCompanyAccess } = require('@/lib/tenant');
    if (!validateCompanyAccess(session.user, existingUser.companyId)) {
      return NextResponse.json({ error: 'Access denied: Tenant mismatch' }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully from live database'
    });
  } catch (error: any) {
    console.error('API User DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
