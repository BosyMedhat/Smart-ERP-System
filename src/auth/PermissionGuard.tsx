import React from 'react';
import { canAccessScreen, Role } from './roles';

interface PermissionGuardProps {
  role: Role | string | null;
  screen: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  role,
  screen,
  children,
  fallback = null,
}: PermissionGuardProps) {
  if (!role) return <>{fallback}</>;
  if (!canAccessScreen(role, screen)) return <>{fallback}</>;
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
