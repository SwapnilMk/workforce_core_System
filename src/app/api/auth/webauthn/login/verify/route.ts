import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import prisma from '@/lib/prisma';
import { login } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
  const body = await req.json();
  
  // For demo, we'll auto-login the admin user if biometric is triggered
  // In a real app, you would verify against stored authenticators
  
  const user = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN }
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  await login({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId
  });

  return NextResponse.json({ success: true, user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId
  }});
}
