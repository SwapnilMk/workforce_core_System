import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // In a real app, you'd get the user from their email provided in the login form
  // For demo purposes, we'll just return general options
  const options = await generateAuthenticationOptions({
    rpID: 'localhost',
    allowCredentials: [],
    userVerification: 'preferred',
  });

  return NextResponse.json(options);
}
