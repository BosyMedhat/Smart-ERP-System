"""
Management command: sync_permissions
- Creates default roles if not exist
- Creates all system permissions
- Assigns all permissions to مدير role
- Idempotent: safe to run multiple times
"""

from django.core.management.base import BaseCommand
from accounts.models import Role, Permission, RolePermission

SYSTEM_ROLES = [
    {'name': 'مدير',      'name_en': 'Manager',   'level': 0, 'is_system': True},
    {'name': 'كاشير',     'name_en': 'Cashier',   'level': 1, 'is_system': True},
    {'name': 'محاسب',     'name_en': 'Accountant','level': 2, 'is_system': True},
    {'name': 'أمين مخزن', 'name_en': 'Warehouse', 'level': 3, 'is_system': True},
]

SYSTEM_PERMISSIONS = {
    'dashboard': [
        ('view',   'عرض لوحة التحكم'),
    ],
    'pos': [
        ('view',   'فتح شاشة البيع'),
        ('create', 'إنشاء فاتورة بيع'),
    ],
    'inventory': [
        ('view',   'عرض المخزن'),
        ('create', 'إضافة منتج'),
        ('edit',   'تعديل منتج'),
        ('delete', 'حذف منتج'),
    ],
    'sales': [
        ('view',   'عرض سجل المبيعات'),
        ('export', 'تصدير المبيعات'),
    ],
    'customers': [
        ('view',   'عرض العملاء'),
        ('create', 'إضافة عميل'),
        ('edit',   'تعديل عميل'),
        ('delete', 'حذف عميل'),
    ],
    'suppliers': [
        ('view',   'عرض الموردين'),
        ('create', 'إضافة مورد'),
        ('edit',   'تعديل مورد'),
        ('delete', 'حذف مورد'),
    ],
    'installments': [
        ('view',   'عرض الأقساط'),
        ('create', 'إضافة قسط'),
        ('edit',   'تعديل قسط'),
    ],
    'credit': [
        ('view',   'عرض الآجل'),
        ('create', 'إضافة آجل'),
        ('edit',   'تعديل آجل'),
    ],
    'hr': [
        ('view',   'عرض الموارد البشرية'),
        ('create', 'إضافة موظف'),
        ('edit',   'تعديل موظف'),
        ('delete', 'حذف موظف'),
        ('payroll','صرف الرواتب'),
    ],
    'reports': [
        ('view',   'عرض التقارير'),
        ('export', 'تصدير التقارير'),
    ],
    'pl': [
        ('view',   'عرض الأرباح والخسائر'),
        ('export', 'تصدير الأرباح والخسائر'),
    ],
    'treasury': [
        ('view',   'عرض الخزينة'),
        ('create', 'إضافة حركة خزينة'),
        ('edit',   'تعديل حركة خزينة'),
        ('delete', 'حذف حركة خزينة'),
    ],
    'ai': [
        ('view',   'استخدام مركز الذكاء الاصطناعي'),
    ],
    'settings': [
        ('view',   'عرض الإعدادات'),
        ('edit',   'تعديل الإعدادات'),
    ],
    'users': [
        ('view',   'عرض المستخدمين'),
        ('create', 'إضافة مستخدم'),
        ('edit',   'تعديل مستخدم'),
        ('delete', 'حذف مستخدم'),
    ],
    'audit': [
        ('view',   'عرض سجل التدقيق'),
    ],
    'roles': [
        ('view',              'عرض الأدوار'),
        ('create',            'إنشاء دور'),
        ('edit',              'تعديل دور'),
        ('delete',            'حذف دور'),
        ('manage_permissions','إدارة صلاحيات الأدوار'),
    ],
    'automation': [
        ('view',   'عرض الأتمتة'),
        ('edit',   'تعديل قواعد الأتمتة'),
    ],
}


class Command(BaseCommand):
    help = 'Sync system roles and permissions — idempotent'

    def handle(self, *args, **options):
        self.stdout.write('⟳  Syncing roles...')
        for role_data in SYSTEM_ROLES:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={
                    'name_en':    role_data['name_en'],
                    'level':      role_data['level'],
                    'is_system':  role_data['is_system'],
                }
            )
            status = 'created' if created else 'exists'
            self.stdout.write(f'  Role [{role.name}] — {status}')

        self.stdout.write('⟳  Syncing permissions...')
        all_permissions = []
        for module, actions in SYSTEM_PERMISSIONS.items():
            for action, description_ar in actions:
                perm, created = Permission.objects.get_or_create(
                    module=module,
                    action=action,
                    defaults={'description_ar': description_ar}
                )
                all_permissions.append(perm)
                status = 'created' if created else 'exists'
                self.stdout.write(f'  Permission [{module}:{action}] — {status}')

        self.stdout.write('⟳  Assigning ALL permissions to مدير role...')
        try:
            manager_role = Role.objects.get(name='مدير')
            added = 0
            for perm in all_permissions:
                _, created = RolePermission.objects.get_or_create(
                    role=manager_role,
                    permission=perm,
                )
                if created:
                    added += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓  مدير role: {added} new permissions assigned '
                    f'(total: {manager_role.role_permissions.count()})'
                )
            )
        except Role.DoesNotExist:
            self.stdout.write(self.style.ERROR('✗  مدير role not found!'))

        # ── Default permissions for other roles ──
        DEFAULT_ROLE_PERMISSIONS = {
            'كاشير': [
                'dashboard:view',
                'pos:view', 'pos:create',
                'sales:view',
                'customers:view', 'customers:create', 'customers:edit',
                'installments:view', 'installments:create', 'installments:edit',
                'credit:view', 'credit:create',
                'inventory:view',
                'ai:view',
                'profile:view',
            ],
            'محاسب': [
                'dashboard:view',
                'sales:view', 'sales:export',
                'customers:view', 'customers:create', 'customers:edit',
                'installments:view', 'installments:create', 'installments:edit',
                'credit:view', 'credit:create', 'credit:edit',
                'reports:view', 'reports:export',
                'pl:view', 'pl:export',
                'treasury:view', 'treasury:create',
                'suppliers:view',
                'ai:view',
                'profile:view',
            ],
            'أمين مخزن': [
                'dashboard:view',
                'inventory:view', 'inventory:create', 'inventory:edit',
                'suppliers:view', 'suppliers:create', 'suppliers:edit',
                'sales:view',
                'ai:view',
                'profile:view',
            ],
        }

        self.stdout.write('⟳  Assigning default permissions to other roles...')
        for role_name, perm_codes in DEFAULT_ROLE_PERMISSIONS.items():
            try:
                role = Role.objects.get(name=role_name)
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'  ⚠ Role [{role_name}] not found')
                )
                continue

            added = 0
            for code in perm_codes:
                parts = code.split(':')
                if len(parts) != 2:
                    continue
                module, action = parts
                try:
                    perm = Permission.objects.get(module=module, action=action)
                    _, created = RolePermission.objects.get_or_create(
                        role=role, permission=perm
                    )
                    if created:
                        added += 1
                except Permission.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'    ⚠ Permission [{code}] not found'
                        )
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f'  ✓ [{role_name}]: {added} new permissions assigned '
                    f'(total: {role.role_permissions.count()})'
                )
            )

        self.stdout.write(self.style.SUCCESS('✓  sync_permissions completed successfully'))
