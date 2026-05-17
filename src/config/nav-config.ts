import { NavGroup } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: true,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Workforce Management',
    items: [
      {
        title: 'Employees',
        url: '/dashboard/employees',
        icon: 'teams',
        shortcut: ['e', 'e'],
        isActive: false,
        access: { roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'] },
        items: []
      },
      {
        title: 'Attendance',
        url: '/dashboard/attendance',
        icon: 'calendar',
        shortcut: ['a', 'a'],
        isActive: false,
        items: []
      },
      {
        title: 'Leaves',
        url: '/dashboard/leaves',
        icon: 'kanban',
        shortcut: ['l', 'l'],
        isActive: false,
        items: []
      },
      {
        title: 'Daily Work Logs',
        url: '/dashboard/jd',
        icon: 'calendar',
        shortcut: ['j', 'd'],
        isActive: false,
        items: []
      },
      {
        title: 'Chat',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['c', 'h'],
        isActive: false,
        items: []
      },
      {
        title: 'Announcements',
        url: '/dashboard/announcements',
        icon: 'notification',
        shortcut: ['n', 'n'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Financials',
    items: [
      {
        title: 'Payroll',
        url: '/dashboard/payroll',
        icon: 'billing',
        shortcut: ['p', 'y'],
        isActive: false,
        access: { roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'EMPLOYEE'] },
        items: []
      },
      {
        title: 'Salary Calculator',
        url: '/dashboard/salary-calculator',
        icon: 'billing',
        shortcut: ['s', 'c'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Administration',
    items: [
      {
        title: 'Reports',
        url: '/dashboard/reports',
        icon: 'media',
        shortcut: ['r', 'r'],
        isActive: false,
        access: { roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'] },
        items: []
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 's'],
        isActive: false,
        access: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        items: []
      }
    ]
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        shortcut: ['n', 'n'],
        isActive: false,
        items: []
      }
    ]
  }
];
