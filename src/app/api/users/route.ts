import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 10);
    const rolesParam = searchParams.get('roles'); 
    const search = searchParams.get('search') ?? undefined;

    // Build filter
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (rolesParam) {
      const rolesArray = rolesParam.split(/[.,]/).map(r => r.toUpperCase().replace(' ', '_'));
      const prismaRoles: UserRole[] = [];
      
      rolesArray.forEach(r => {
        if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN') prismaRoles.push(UserRole.SUPER_ADMIN);
        else if (r === 'HR') prismaRoles.push(UserRole.HR);
        else if (r === 'MANAGER') prismaRoles.push(UserRole.MANAGER);
        else if (r === 'EMPLOYEE') prismaRoles.push(UserRole.EMPLOYEE);
        else if (r === 'ADMIN') prismaRoles.push(UserRole.ADMIN);
      });

      if (prismaRoles.length > 0) {
        where.role = { in: prismaRoles };
      }
    }

    const totalUsers = await prisma.user.count({ where });

    const offset = (page - 1) * limit;
    
    const dbUsers = await prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Map Prisma Users to Frontend User format
    const users = dbUsers.map((user, idx) => {
      const nameParts = (user.name || 'Anonymous User').split(' ');
      const first_name = nameParts[0] || 'Anonymous';
      const last_name = nameParts.slice(1).join(' ') || 'User';
      
      // Map role from Enum to display string
      let displayRole = 'Employee';
      if (user.role === UserRole.SUPER_ADMIN) displayRole = 'Super Admin';
      else if (user.role === UserRole.HR) displayRole = 'HR';
      else if (user.role === UserRole.MANAGER) displayRole = 'Manager';
      else if (user.role === UserRole.ADMIN) displayRole = 'Admin';
      
      return {
        id: idx + offset + 1, // numeric id for frontend compatibility
        dbId: user.id, // actual Mongo ObjectId
        first_name,
        last_name,
        email: user.email,
        phone: '+91 98765 43210', 
        role: displayRole,
        status: 'Active',
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      time: new Date().toISOString(),
      message: 'Real-time database records retrieved successfully',
      total_users: totalUsers,
      offset,
      limit,
      users,
    });
  } catch (error: any) {
    console.error('API Users GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, role, phone } = body;

    let dbRole: UserRole = UserRole.EMPLOYEE;
    const rUpper = (role || '').toUpperCase().replace(' ', '_');
    if (rUpper === 'SUPER_ADMIN') dbRole = UserRole.SUPER_ADMIN;
    else if (rUpper === 'HR') dbRole = UserRole.HR;
    else if (rUpper === 'MANAGER') dbRole = UserRole.MANAGER;
    else if (rUpper === 'ADMIN') dbRole = UserRole.ADMIN;

    // Create a new user with standard password
    const hashedPassword = await bcrypt.hash('employee123', 10);

    const newUser = await prisma.user.create({
      data: {
        name: `${first_name} ${last_name}`,
        email,
        password: hashedPassword,
        role: dbRole,
        biometricEnabled: false,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Employee onboarded successfully in live database',
      user: {
        id: newUser.id,
        first_name,
        last_name,
        email: newUser.email,
        phone: phone || '+91 98765 43210',
        role: role || 'Employee',
        status: 'Active',
        created_at: newUser.createdAt.toISOString(),
        updated_at: newUser.updatedAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Users POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
