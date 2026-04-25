# from django.db import models

# class Customer(models.Model):
#     name = models.CharField(max_length=255, verbose_name="اسم العميل")
#     phone = models.CharField(max_length=20, verbose_name="رقم التليفون")
#     email = models.EmailField(blank=True, null=True, verbose_name="البريد الإلكتروني")
#     address = models.TextField(blank=True, null=True, verbose_name="العنوان")
#     balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="الرصيد")
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name



# from django.db import models
# from django.contrib.auth.models import User
# from django.db.models.signals import post_save
# from django.dispatch import receiver

# # موديل العملاء
# class Customer(models.Model):
#     name = models.CharField(max_length=255, verbose_name="اسم العميل")
#     phone = models.CharField(max_length=20, verbose_name="رقم التليفون")
#     email = models.EmailField(blank=True, null=True, verbose_name="البريد الإلكتروني")
#     address = models.TextField(blank=True, null=True, verbose_name="العنوان")
#     balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="الرصيد")
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

# # الموديل المطور لتوسيع بيانات المستخدم (Profile)
# class UserProfile(models.Model):
#     # تعريف الأدوار المتاحة في النظام
#     ROLE_CHOICES = [
#         ('ADMIN', 'مدير النظام'),
#         ('CASHIER', 'كاشير'),
#     ]

#     user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
#     role = models.CharField(
#         max_length=10, 
#         choices=ROLE_CHOICES, 
#         default='CASHIER', 
#         verbose_name="الوظيفة"
#     )
    
#     # الصلاحيات الافتراضية لكل دور
#     permissions = models.JSONField(default=dict, blank=True, verbose_name="الصلاحيات")

#     def __str__(self):
#         return f"{self.user.username} - {self.get_role_display()}"

# # "Signal" لإنشاء بروفايل تلقائياً عند إضافة مستخدم جديد
# @receiver(post_save, sender=User)
# def create_user_profile(sender, instance, created, **kwargs):
#     if created:
#         # تحديد صلاحيات مبدئية لو كاشير
#         default_perms = {}
#         if not instance.is_superuser: # لو مستخدم عادي هنفترض إنه كاشير
#             default_perms = {
#                 "can_view_pos": True,
#                 "can_view_reports": False,
#                 "can_edit_inventory": False
#             }
#         UserProfile.objects.create(user=instance, permissions=default_perms)

from django.db import models

# هنسيب موديل العملاء فقط في هذا الملف لمنع التضارب (Clash)
class Customer(models.Model):
    name = models.CharField(max_length=255, verbose_name="اسم العميل")
    phone = models.CharField(max_length=20, verbose_name="رقم التليفون", null=True, blank=True)
    email = models.EmailField(blank=True, null=True, verbose_name="البريد الإلكتروني")
    address = models.TextField(blank=True, null=True, verbose_name="العنوان")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="الرصيد")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
