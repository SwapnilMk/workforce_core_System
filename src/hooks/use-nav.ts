'use client';

/**
 * Fully client-side hook for filtering navigation items based on RBAC
 *
 * This hook uses Clerk's client-side hooks to check permissions, roles, and organization
 * without any server calls. This is perfect for navigation visibility (UX only).
 *
 * Performance:
 * - All checks are synchronous (no server calls)
 * - Instant filtering
 * - No loading states
 * - No UI flashing
 *
 * Note: For actual security (API routes, server actions), always use server-side checks.
 * This is only for UI visibility.
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import type { NavItem, NavGroup } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  const { user, isAuthenticated } = useAuthStore();

  const filteredItems = useMemo(() => {
    if (!isAuthenticated || !user) return [];

    return items
      .filter((item) => {
        if (!item.access) return true;
        
        // Simple role-based access for the custom store
        if (item.access.role && user.role.toLowerCase() !== item.access.role.toLowerCase()) {
          return false;
        }

        return true;
      })
      .map((item) => {
        if (item.items && item.items.length > 0) {
          const filteredChildren = item.items.filter((childItem) => {
            if (!childItem.access) return true;
            if (childItem.access.role && user.role.toLowerCase() !== childItem.access.role.toLowerCase()) {
              return false;
            }
            return true;
          });

          return {
            ...item,
            items: filteredChildren
          };
        }

        return item;
      });
  }, [items, user, isAuthenticated]);

  return filteredItems;
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
