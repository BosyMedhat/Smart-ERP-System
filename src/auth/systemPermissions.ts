/**
 * System Permissions Registry
 * Single source of truth for all module:action pairs.
 * Mirrors smart_erp_backend/accounts/management/commands/sync_permissions.py
 */

export type ModuleAction = `${string}:${string}`;

export const SYSTEM_PERMISSIONS: Record<string, {
  action: string;
  description_ar: string;
}[]> = {
  dashboard:       [{ action: 'view',              description_ar: 'عرض لوحة التحكم' }],
  pos:             [{ action: 'view',              description_ar: 'فتح شاشة البيع' },
                   { action: 'create',             description_ar: 'إنشاء فاتورة بيع' }],
  inventory:       [{ action: 'view',              description_ar: 'عرض المخزن' },
                   { action: 'create',             description_ar: 'إضافة منتج' },
                   { action: 'edit',               description_ar: 'تعديل منتج' },
                   { action: 'delete',             description_ar: 'حذف منتج' }],
  sales:           [{ action: 'view',              description_ar: 'عرض سجل المبيعات' },
                   { action: 'export',             description_ar: 'تصدير المبيعات' }],
  customers:       [{ action: 'view',              description_ar: 'عرض العملاء' },
                   { action: 'create',             description_ar: 'إضافة عميل' },
                   { action: 'edit',               description_ar: 'تعديل عميل' },
                   { action: 'delete',             description_ar: 'حذف عميل' }],
  suppliers:       [{ action: 'view',              description_ar: 'عرض الموردين' },
                   { action: 'create',             description_ar: 'إضافة مورد' },
                   { action: 'edit',               description_ar: 'تعديل مورد' },
                   { action: 'delete',             description_ar: 'حذف مورد' }],
  installments:    [{ action: 'view',              description_ar: 'عرض الأقساط' },
                   { action: 'create',             description_ar: 'إضافة قسط' },
                   { action: 'edit',               description_ar: 'تعديل قسط' }],
  credit:          [{ action: 'view',              description_ar: 'عرض الآجل' },
                   { action: 'create',             description_ar: 'إضافة آجل' },
                   { action: 'edit',               description_ar: 'تعديل آجل' }],
  hr:              [{ action: 'view',              description_ar: 'عرض الموارد البشرية' },
                   { action: 'create',             description_ar: 'إضافة موظف' },
                   { action: 'edit',               description_ar: 'تعديل موظف' },
                   { action: 'delete',             description_ar: 'حذف موظف' },
                   { action: 'payroll',            description_ar: 'صرف الرواتب' }],
  reports:         [{ action: 'view',              description_ar: 'عرض التقارير' },
                   { action: 'export',             description_ar: 'تصدير التقارير' }],
  pl:              [{ action: 'view',              description_ar: 'عرض الأرباح والخسائر' },
                   { action: 'export',             description_ar: 'تصدير الأرباح والخسائر' }],
  treasury:        [{ action: 'view',              description_ar: 'عرض الخزينة' },
                   { action: 'create',             description_ar: 'إضافة حركة خزينة' },
                   { action: 'edit',               description_ar: 'تعديل حركة خزينة' },
                   { action: 'delete',             description_ar: 'حذف حركة خزينة' }],
  ai:              [{ action: 'view',              description_ar: 'استخدام مركز الذكاء الاصطناعي' }],
  settings:        [{ action: 'view',              description_ar: 'عرض الإعدادات' },
                   { action: 'edit',               description_ar: 'تعديل الإعدادات' }],
  users:           [{ action: 'view',              description_ar: 'عرض المستخدمين' },
                   { action: 'create',             description_ar: 'إضافة مستخدم' },
                   { action: 'edit',               description_ar: 'تعديل مستخدم' },
                   { action: 'delete',             description_ar: 'حذف مستخدم' }],
  audit:           [{ action: 'view',              description_ar: 'عرض سجل التدقيق' }],
  representatives: [{ action: 'view',              description_ar: 'عرض المناديب' },
                   { action: 'create',             description_ar: 'إضافة مندوب' },
                   { action: 'edit',               description_ar: 'تعديل مندوب' },
                   { action: 'delete',             description_ar: 'حذف مندوب' }],
  roles:           [{ action: 'view',              description_ar: 'عرض الأدوار' },
                   { action: 'create',             description_ar: 'إنشاء دور' },
                   { action: 'edit',               description_ar: 'تعديل دور' },
                   { action: 'delete',             description_ar: 'حذف دور' },
                   { action: 'manage_permissions', description_ar: 'إدارة صلاحيات الأدوار' }],
  automation:      [{ action: 'view',              description_ar: 'عرض الأتمتة' },
                   { action: 'edit',               description_ar: 'تعديل قواعد الأتمتة' }],
};

/**
 * TAB_PERMISSIONS
 * Maps each screen/tab to required module:action permission.
 * `null` = explicitly public (no permission required, e.g. profile).
 * Used by filterSidebar() and hasScreenPermission().
 */
export const TAB_PERMISSIONS: Record<string, string | null> = {
  home:            'dashboard:view',
  pos:             'pos:view',
  inventory:       'inventory:view',
  sales:           'sales:view',
  customers:       'customers:view',
  suppliers:       'suppliers:view',
  installments:    'installments:view',
  credit:          'credit:view',
  hr:              'hr:view',
  reports:         'reports:view',
  pl:              'pl:view',
  treasury:        'treasury:view',
  ai:              'ai:view',
  settings:        'settings:view',
  users:           'users:view',
  audit:           'audit:view',
  representatives: 'representatives:view',
  roles:           'roles:view',
  automation:      'automation:view',
  profile:         null,
};

/**
 * hasScreenPermission
 * Pure function — no React, no hooks.
 * Used by Sidebar and App.tsx for screen-level gating.
 */
export function hasScreenPermission(
  permissionList: string[],
  screen: string,
  roleLevel?: number
): boolean {
  // مدير (level=0) = full access
  if (roleLevel === 0) return true;

  // profile is always accessible
  if (screen === 'profile') return true;

  const required = TAB_PERMISSIONS[screen];
  if (required === null) return true;    // explicitly public
  if (!required) return false;           // unknown screen = deny
  return permissionList.includes(required);
}

/**
 * can — single module:action check
 */
export function can(
  permissionList: string[],
  module: string,
  action: string,
  roleLevel?: number
): boolean {
  if (roleLevel === 0) return true;
  return permissionList.includes(`${module}:${action}`);
}

/**
 * canAny — OR check across multiple module:action strings
 */
export function canAny(
  permissionList: string[],
  required: string[],
  roleLevel?: number
): boolean {
  if (roleLevel === 0) return true;
  return required.some(p => permissionList.includes(p));
}
