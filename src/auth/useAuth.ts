import { useCallback } from 'react';
import { ROLES, Role, canAccessScreen, isManager } from './roles';

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
  const hasPermission = useCallback(
    (screen: string): boolean => {
      if (!currentUser) return false;
      return canAccessScreen(currentUser.role, screen);
    },
    [currentUser]
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
      if (isManager(currentUser.role)) return true;
      const allPerms = Object.values(currentUser.permissions || {}).flat();
      return allPerms.includes(permission);
    },
    [currentUser]
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
