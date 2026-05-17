'use client';

import * as React from 'react';
import { Briefcase, ChevronsUpDown, Check, Building, Plus } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function OrgSwitcher() {
  const { user, setUser } = useAuthStore();
  const [companies, setCompanies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // Load companies if the user is SUPER_ADMIN
  React.useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return;

    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCompanies(data.companies);
          }
        }
      } catch (err) {
        console.error('Failed to load companies switcher list:', err);
      }
    };

    fetchCompanies();
  }, [user]);

  // Find active company
  const activeCompany = React.useMemo(() => {
    if (!user) return null;
    // For non-Super Admin, their company is user.companyId
    // For Super Admin, it's the currently active switched companyId
    if (companies.length > 0 && user.companyId) {
      return companies.find((c) => c.id === user.companyId) || null;
    }
    return null;
  }, [user, companies]);

  const handleSwitch = async (companyId: string) => {
    if (!user || loading) return;
    setLoading(true);
    const switchToast = toast.loading('Switching company workspace...');

    try {
      const res = await fetch('/api/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to switch company');
      }

      // Update local auth store
      const updatedUser = {
        ...user,
        companyId,
      };
      setUser(updatedUser);

      toast.success(data.message || `Switched workspace successfully!`, {
        id: switchToast,
      });

      // Global reload to re-fetch all data and reset React Query states
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch company', {
        id: switchToast,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Show normal workspace display if not SUPER_ADMIN
  if (user.role !== 'SUPER_ADMIN') {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
              <Briefcase className='size-4' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>EGC Workforce</span>
              <span className='truncate text-xs'>Assigned Workspace</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-neutral-800/40 bg-neutral-900/20 backdrop-blur-md transition-all hover:bg-neutral-800/30'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden'>
                {activeCompany?.logo ? (
                  <img
                    src={activeCompany.logo}
                    alt={activeCompany.name}
                    className='size-full object-cover'
                  />
                ) : (
                  <Building className='size-4' />
                )}
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeCompany ? activeCompany.name : 'Super Admin Workspace'}
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {activeCompany ? 'Tenant Active' : 'Global View'}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4 text-neutral-400' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-64 rounded-xl border-neutral-800/80 bg-neutral-950/95 backdrop-blur-lg text-white'
            align='start'
            side='bottom'
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs font-semibold text-neutral-400 px-3 py-2'>
              Switch Company Context
            </DropdownMenuLabel>
            <DropdownMenuSeparator className='bg-neutral-800/60' />
            
            {companies.length === 0 ? (
              <div className='px-3 py-4 text-center text-xs text-neutral-500'>
                No companies created yet.
              </div>
            ) : (
              companies.map((company) => {
                const isActive = user.companyId === company.id;
                return (
                  <DropdownMenuItem
                    key={company.id}
                    onClick={() => handleSwitch(company.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-neutral-800/60 text-white font-medium' 
                        : 'hover:bg-neutral-800/30 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className='flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground overflow-hidden shrink-0 border border-neutral-800/40'>
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className='size-full object-cover' />
                      ) : (
                        <Building className='size-4' />
                      )}
                    </div>
                    <div className='flex-1 text-left text-xs truncate leading-tight'>
                      <span className='block truncate font-semibold'>{company.name}</span>
                      <span className='block truncate text-[10px] text-neutral-400'>{company.city}, {company.state}</span>
                    </div>
                    {isActive && (
                      <Check className='size-4 text-emerald-500 shrink-0' />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}

            <DropdownMenuSeparator className='bg-neutral-800/60' />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className='flex items-center gap-2 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800/30 text-xs'
            >
              <Plus className='size-4' />
              <span>Create New Company</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
