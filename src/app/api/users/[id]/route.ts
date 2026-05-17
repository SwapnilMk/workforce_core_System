import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { first_name, last_name, email, role } = body;

    let dbRole: UserRole = UserRole.EMPLOYEE;
    const rUpper = (role || '').toUpperCase().replace(' ', '_');
    if (rUpper === 'SUPER_ADMIN') dbRole = UserRole.SUPER_ADMIN;
    else if (rUpper === 'HR') dbRole = UserRole.HR;
    else if (rUpper === 'MANAGER') dbRole = UserRole.MANAGER;
    else if (rUpper === 'ADMIN') dbRole = UserRole.ADMIN;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: `${first_name} ${last_name}`,
        email,
        role: dbRole,
      }
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
    const { id } = await params;

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
