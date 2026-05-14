'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth-store';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function ExclusivePage() {
  const { user } = useAuthStore();
  
  const isAuthorized = user?.role === 'Admin' || user?.role === 'Manager';

  if (!isAuthorized) {
    return (
      <PageContainer>
        <div className='flex h-full items-center justify-center'>
          <Alert variant="destructive" className="max-w-md">
            <Icons.lock className='h-5 w-5' />
            <AlertDescription>
              <div className='mb-1 text-lg font-semibold'>Access Restricted</div>
              <div className='text-muted-foreground'>
                This page is only available to <span className='font-semibold'>Admin</span> or <span className='font-semibold'>Manager</span> roles.
                <br />
                Please contact your system administrator if you believe this is an error.
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div>
          <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
            <Icons.badgeCheck className='h-7 w-7 text-green-600' />
            Exclusive Area
          </h1>
          <p className='text-muted-foreground'>
            Welcome, <span className='font-semibold'>{user?.name}</span>! This page
            contains exclusive features for organizational leadership.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Exclusive Manager & Admin Insights</CardTitle>
            <CardDescription>
              You have access to this area because of your {user?.role} role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-lg'>Have a productive day overseeing the workforce!</div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
