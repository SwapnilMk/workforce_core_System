'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import LogoutConfirmation from '../auth/logout-confirmation';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const filteredGroups = useFilteredNavGroups(navGroups);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

  const fetchUnreadCounts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/chat/unread');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUnreadMessages(data.unreadMessages);
          setUnreadNotifications(data.unreadNotifications);
        }
      }
    } catch (err) {
      console.error('Failed to load sidebar unread counts:', err);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 5000);
      window.addEventListener('egc_poll_chat', fetchUnreadCounts);
      return () => {
        clearInterval(interval);
        window.removeEventListener('egc_poll_chat', fetchUnreadCounts);
      };
    }
  }, [user, fetchUnreadCounts]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      toast.success('Logged out securely');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <Sidebar collapsible='icon'>
        <SidebarHeader className='group-data-[collapsible=icon]:pt-4'>
          <OrgSwitcher />
        </SidebarHeader>
        <SidebarContent className='overflow-x-hidden'>
          {filteredGroups.map((group) => (
            <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
              {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                  return item?.items && item?.items?.length > 0 ? (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.isActive}
                      className='group/collapsible'
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                            {item.icon && <Icon />}
                            <span>{item.title}</span>
                            <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url} className='flex w-full items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <Icon />
                            <span>{item.title}</span>
                          </div>
                          {item.title === 'Chat' && unreadMessages > 0 && (
                            <span className='bg-primary text-primary-foreground flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[9px] font-extrabold shadow-sm shrink-0 ml-auto mr-1'>
                              {unreadMessages}
                            </span>
                          )}
                          {item.title === 'Notifications' && unreadNotifications > 0 && (
                            <span className='bg-destructive text-destructive-foreground flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[9px] font-extrabold shadow-sm shrink-0 ml-auto mr-1'>
                              {unreadNotifications}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size='lg'
                    className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                  >
                    {user && (
                      <div className="flex items-center gap-2">
                        <UserAvatarProfile className='h-8 w-8 rounded-lg' showInfo={false} user={user} />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{user.name}</span>
                          <span className="truncate text-xs">{user.email}</span>
                        </div>
                      </div>
                    )}
                    <Icons.chevronsDown className='ml-auto size-4' />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                  side='bottom'
                  align='end'
                  sideOffset={4}
                >
                  <DropdownMenuLabel className='p-0 font-normal'>
                    <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                      {user && (
                        <UserAvatarProfile className='h-8 w-8 rounded-lg' showInfo={false} user={user} />
                      )}
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                      <Icons.account className='mr-2 h-4 w-4' />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
                      <Icons.notification className='mr-2 h-4 w-4' />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)}>
                    <Icons.logout className='mr-2 h-4 w-4 text-destructive' />
                    <span className="text-destructive font-semibold">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AnimatePresence>
        {showLogoutConfirm && (
          <LogoutConfirmation 
            onConfirm={handleLogout} 
            onCancel={() => setShowLogoutConfirm(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
