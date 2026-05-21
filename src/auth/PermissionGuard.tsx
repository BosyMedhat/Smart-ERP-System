import React from 'react';
import { Role } from './roles';
import { hasScreenPermission } from './systemPermissions';

interface PermissionGuardProps {
  role: Role | string | null;
  screen: string;
  permissionList?: string[];
  roleLevel?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  role,
  screen,
  permissionList = [],
  roleLevel,
  children,
  fallback = null,
}: PermissionGuardProps) {
  if (!role) return <>{fallback}</>;
  if (!hasScreenPermission(permissionList, screen, roleLevel)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

interface RoleGuardProps {
  role: Role | string | null;
  allowedRoles: (Role | string)[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  role,
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  if (!role) return <>{fallback}</>;
  if (!allowedRoles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
