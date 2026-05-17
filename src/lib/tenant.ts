export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  companyId?: string | null;
}

/**
 * Returns a prisma-compatible filter object for strict tenant isolation.
 * For SUPER_ADMIN: filters by the switched/selected companyId (if active), otherwise no filter (global view).
 * For all other roles: strictly isolates queries to their own companyId.
 */
export function getTenantFilter(user?: SessionUser | null) {
  if (!user) {
    return { companyId: 'UNAUTHORIZED_BLOCKED' };
  }

  if (user.role === 'SUPER_ADMIN') {
    if (user.companyId) {
      return { companyId: user.companyId };
    }
    return {}; // Super Admin sees all when no company is selected
  }

  if (!user.companyId) {
    return { companyId: 'NO_COMPANY_ASSIGNED' };
  }

  return { companyId: user.companyId };
}

/**
 * Validates if the user is authorized to perform changes on a resource belonging to a specific company.
 */
export function validateCompanyAccess(user: SessionUser | null, companyId: string | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return user.companyId === companyId;
}
