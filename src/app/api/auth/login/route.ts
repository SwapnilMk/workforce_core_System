import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { login } from '@/lib/auth';
import { headers } from 'next/headers';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { email, password, rememberDevice } = await req.json();
    const headerList = await headers();
    const userAgent = headerList.get('user-agent');
    const ip = headerList.get('x-forwarded-for') || 'unknown';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Log failed attempt
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ip: typeof ip === 'string' ? ip : ip[0],
          userAgent,
          status: 'FAILED',
        }
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session
    await login({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

    // Log success
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ip: typeof ip === 'string' ? ip : ip[0],
        userAgent,
        status: 'SUCCESS',
        isTrusted: rememberDevice || false,
      }
    });

    return NextResponse.json({ 
      message: 'Login successful',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
