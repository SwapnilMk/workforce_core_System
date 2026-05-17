'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import LogoutConfirmation from '../auth/logout-confirmation';

export function UserNav() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      toast.success('Logged out securely');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Logout failed');
      // Fallback local logout
      logout();
      router.push('/auth/login');
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  if (user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
              <UserAvatarProfile user={user} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='end' sideOffset={10} forceMount>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm leading-none font-medium'>{user.name}</p>
                <p className='text-muted-foreground text-xs leading-none'>
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>Notifications</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showLogoutConfirm && (
          <LogoutConfirmation 
            onConfirm={handleLogout} 
            onCancel={() => setShowLogoutConfirm(false)} 
          />
        )}
      </>
    );
  }
}
