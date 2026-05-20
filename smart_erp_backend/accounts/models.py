from django.conf import settings
from django.db import models


class Role(models.Model):
    """دور المستخدم داخل النظام (RBAC)."""

    ROLE_CHOICES = [
        ('مدير', 'مدير النظام'),
        ('كاشير', 'كاشير'),
        ('محاسب', 'محاسب'),
        ('أمين مخزن', 'أمين مخزن'),
    ]

    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='اسم الدور',
    )
    name_en = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='الاسم بالإنجليزية',
    )
    description = models.TextField(
        blank=True,
        verbose_name='الوصف',
    )
    level = models.IntegerField(
        default=99,
        verbose_name='المستوى',
        help_text='0 = أعلى صلاحية (مدير)، الأرقام الأكبر = صلاحية أقل',
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='دور نظام',
        help_text='يحمي الأدوار المدمجة من الحذف',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاريخ الإنشاء',
    )

    class Meta:
        ordering = ['level']
        verbose_name = 'دور'
        verbose_name_plural = 'الأدوار'

    def __str__(self):
        return self.get_name_display()


class Permission(models.Model):
    """صلاحية ذرّية مرتبطة بـ (module, action)."""

    module = models.CharField(
        max_length=50,
        verbose_name='الموديول',
        help_text="مثال: 'sales', 'inventory', 'reports'",
    )
    action = models.CharField(
        max_length=50,
        verbose_name='الإجراء',
        help_text="مثال: 'view', 'create', 'edit', 'delete', 'export'",
    )
    description_ar = models.CharField(
        max_length=200,
        verbose_name='الوصف بالعربية',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاريخ الإنشاء',
    )

    class Meta:
        unique_together = [('module', 'action')]
        ordering = ['module', 'action']
        verbose_name = 'صلاحية'
        verbose_name_plural = 'الصلاحيات'

    def __str__(self):
        return f'{self.module}.{self.action}'


class RolePermission(models.Model):
    """ربط الدور بالصلاحيات الممنوحة له."""

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        verbose_name='الدور',
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        verbose_name='الصلاحية',
    )

    class Meta:
        unique_together = [('role', 'permission')]
        verbose_name = 'صلاحية الدور'
        verbose_name_plural = 'صلاحيات الأدوار'

    def __str__(self):
        return f'{self.role} ← {self.permission}'


class UserPermission(models.Model):
    """صلاحية مخصّصة لمستخدم بعينه (override للدور: منح أو منع صريح)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_permissions_rbac',
        verbose_name='المستخدم',
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='user_permissions',
        verbose_name='الصلاحية',
    )
    granted = models.BooleanField(
        default=True,
        verbose_name='ممنوحة',
        help_text='True = منح، False = منع صريح',
    )

    class Meta:
        unique_together = [('user', 'permission')]
        verbose_name = 'صلاحية المستخدم'
        verbose_name_plural = 'صلاحيات المستخدمين'

    def __str__(self):
        sign = '+' if self.granted else '−'
        return f'{sign} {self.user} → {self.permission}'
