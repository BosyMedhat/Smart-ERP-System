export const ROLES = {
  MANAGER:    'مدير',
  CASHIER:    'كاشير',
  ACCOUNTANT: 'محاسب',
  WAREHOUSE:  'أمين مخزن',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const SCREEN_PERMISSIONS: Record<string, Role[] | ['*']> = {
  'home':         ['*'],
  'pos':          [ROLES.CASHIER, ROLES.MANAGER],
  'inventory':    [ROLES.WAREHOUSE, ROLES.MANAGER],
  'sales':        [ROLES.CASHIER, ROLES.MANAGER, ROLES.ACCOUNTANT],
  'customers':    [ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.CASHIER],
  'suppliers':    [ROLES.MANAGER],
  'installments': [ROLES.CASHIER, ROLES.MANAGER, ROLES.ACCOUNTANT],
  'hr':           [ROLES.MANAGER],
  'reports':      [ROLES.MANAGER, ROLES.ACCOUNTANT],
  'pl':           [ROLES.MANAGER, ROLES.ACCOUNTANT],
  'treasury':     [ROLES.MANAGER, ROLES.ACCOUNTANT],
  'ai':           ['*'],
  'settings':     [ROLES.MANAGER],
  'users':        [ROLES.MANAGER],
  'credit':       [ROLES.MANAGER, ROLES.ACCOUNTANT],
  'profile':      ['*'],
  'automation':   [ROLES.MANAGER],
  'quotations':   [ROLES.MANAGER, ROLES.CASHIER],
  'representatives': [ROLES.MANAGER],
  'audit':         [ROLES.MANAGER],
};

export function canAccessScreen(role: Role | string, screen: string): boolean {
  const allowed = SCREEN_PERMISSIONS[screen];
  if (!allowed) return false;
  if (allowed[0] === '*') return true;
  return (allowed as Role[]).includes(role as Role);
}

export function isManager(role: Role | string): boolean {
  return role === ROLES.MANAGER;
}

export function isAdminRole(role: Role | string): boolean {
  return role === ROLES.MANAGER;
}
