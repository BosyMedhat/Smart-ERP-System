export const ROLES = {
  MANAGER:    'مدير',
  CASHIER:    'كاشير',
  ACCOUNTANT: 'محاسب',
  WAREHOUSE:  'أمين مخزن',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export function isManager(role: Role | string): boolean {
  return role === ROLES.MANAGER;
}
