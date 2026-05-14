'use client';

import * as React from 'react';
import { Briefcase } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function OrgSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-[#1a365d] text-white'>
            <Briefcase className='size-4' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>EGC Workforce</span>
            <span className='truncate text-xs'>Core System</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
