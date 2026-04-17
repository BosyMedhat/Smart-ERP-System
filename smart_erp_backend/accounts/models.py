from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# --- الموديل المطور لتوسيع بيانات المستخدم (Profile) ---
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('مدير', 'مدير النظام'),
        ('كاشير', 'كاشير'),
    ]

    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='كاشير', 
        verbose_name="الوظيفة"
    )
    permissions = models.JSONField(default=dict, blank=True, verbose_name="الصلاحيات")

    def __str__(self):
        return f"{self.user.username} - {self.role}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)

# --- موديل مراقبة العمليات المشبوهة (Audit Log) ---
class SystemAnomaly(models.Model):
    SEVERITY_CHOICES = [
        ('high', 'خطر عالي'),
        ('medium', 'خطر متوسط'),
        ('low', 'خطر منخفض'),
    ]

    employee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="الموظف")
    employee_name = models.CharField("اسم الموظف احتياطي", max_length=255, null=True, blank=True)
    operation_type = models.CharField("نوع العملية", max_length=100)
    old_value = models.CharField("القيمة القديمة", max_length=255, null=True, blank=True)
    new_value = models.CharField("القيمة الجديدة", max_length=255, null=True, blank=True)
    reason = models.TextField("السبب")
    severity = models.CharField("الخطورة", max_length=20, choices=SEVERITY_CHOICES, default='medium')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="وقت العملية")

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "عملية مشبوهة"
        verbose_name_plural = "عمليات مشبوهة"

    def __str__(self):
        return f"{self.operation_type} - {self.employee_name or 'System'}"
