import { NextRequest, NextResponse } from 'next/server';
import { decrypt, updateSession } from '@/lib/auth';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/auth/login', '/'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.nextUrl));
  }

  if (isPublicRoute && session && !path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/dashboard/overview', req.nextUrl));
  }

  return await updateSession(req) || NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
