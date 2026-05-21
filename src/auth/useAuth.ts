import { useCallback } from 'react';
import { ROLES, Role, isManager } from './roles';
import { hasScreenPermission, can } from './systemPermissions';

export interface AuthUser {
  token: string;
  id: number;
  username: string;
  role: Role | string;
  permissions: Record<string, string[]>;
  permission_list?: string[];
  role_obj?: {
    id: number;
    name: string;
    level: number;
    user_count?: number;
  } | null;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('erp_user');
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem('erp_user', JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem('erp_user');
  localStorage.removeItem('lang');
}

export function useAuth(currentUser: AuthUser | null) {
  const perms = currentUser?.permission_list ?? Object.values(currentUser?.permissions ?? {}).flat();
  const roleLevel = currentUser?.role_obj?.level;

  const hasPermission = useCallback(
    (screen: string): boolean => {
      if (!currentUser) return false;
      return hasScreenPermission(perms, screen, roleLevel);
    },
    [currentUser, perms, roleLevel]
  );

  const checkIsManager = useCallback(
    (): boolean => {
      if (!currentUser) return false;
      return isManager(currentUser.role);
    },
    [currentUser]
  );

  const hasSpecificPermission = useCallback(
    (permission: string): boolean => {
      if (!currentUser) return false;
      return can(perms, permission.split(':')[0], permission.split(':')[1] ?? 'view', roleLevel);
    },
    [currentUser, perms, roleLevel]
  );

  return {
    user: currentUser,
    hasPermission,
    isManager: checkIsManager,
    hasSpecificPermission,
    role: currentUser?.role ?? null,
    isAuthenticated: !!currentUser,
    ROLES,
  };
}
