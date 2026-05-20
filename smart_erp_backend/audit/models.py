from django.db import models
from django.contrib.auth.models import User


class AuditLog(models.Model):

    ACTION_CHOICES = [
        ('CREATE',  'إنشاء'),
        ('UPDATE',  'تعديل'),
        ('DELETE',  'حذف'),
        ('LOGIN',   'تسجيل دخول'),
        ('LOGOUT',  'تسجيل خروج'),
        ('EXPORT',  'تصدير'),
        ('VIEW',    'عرض'),
    ]

    user         = models.ForeignKey(
                       User,
                       on_delete=models.SET_NULL,
                       null=True, blank=True,
                       related_name='audit_logs',
                       verbose_name='المستخدم'
                   )
    action       = models.CharField(
                       max_length=20,
                       choices=ACTION_CHOICES,
                       verbose_name='الإجراء'
                   )
    model_name   = models.CharField(
                       max_length=100,
                       blank=True,
                       verbose_name='النموذج'
                   )
    object_id    = models.PositiveIntegerField(
                       null=True, blank=True,
                       verbose_name='رقم السجل'
                   )
    object_repr  = models.CharField(
                       max_length=500,
                       blank=True,
                       verbose_name='وصف السجل'
                   )
    changes      = models.JSONField(
                       default=dict,
                       blank=True,
                       verbose_name='التغييرات'
                   )
    ip_address   = models.GenericIPAddressField(
                       null=True, blank=True,
                       verbose_name='عنوان IP'
                   )
    extra_data   = models.JSONField(
                       default=dict,
                       blank=True,
                       verbose_name='بيانات إضافية'
                   )
    created_at   = models.DateTimeField(
                       auto_now_add=True,
                       verbose_name='وقت العملية'
                   )

    class Meta:
        verbose_name        = 'سجل تدقيق'
        verbose_name_plural = 'سجلات التدقيق'
        ordering            = ['-created_at']

    def __str__(self):
        username = self.user.username if self.user else 'نظام'
        return f"{username} — {self.get_action_display()} — {self.model_name} — {self.created_at:%Y-%m-%d %H:%M}"
