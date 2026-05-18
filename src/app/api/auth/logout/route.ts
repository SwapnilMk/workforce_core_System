import { NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST() {
  await logout();
  return NextResponse.json({ message: 'Logged out successfully' });
}

export async function GET(request: Request) {
  await logout();
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/auth/login';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
