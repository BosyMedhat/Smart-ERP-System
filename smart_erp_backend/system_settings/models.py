from django.db import models
from django.core.validators import RegexValidator # بنستورد أداة التحقق

class SystemConfiguration(models.Model):
    # 1. validator لاسم الشركة: يسمح بحروف (عربي وإنجليزي) ومسافات فقط
    company_name_validator = RegexValidator(
        regex=r'^[a-zA-Z\s\u0600-\u06FF]+$',
        message='اسم المؤسسة يجب أن يحتوي على حروف فقط (لا يسمح بالأرقام).'
    )

    # 2. validator لرقم الهاتف: يسمح بأرقام وعلامة + في البداية فقط
    phone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message='رقم الهاتف يجب أن يكون أرقاماً فقط (من 9 لـ 15 رقم).'
    )

    # الحقول بعد إضافة الـ Validators
    company_name = models.CharField(
        max_length=255, 
        verbose_name="اسم المؤسسة", 
        null=True, 
        blank=True,
        validators=[company_name_validator] # تفعيل التحقق هنا
    )
    
    phone_number = models.CharField(
        max_length=20, 
        verbose_name="رقم الهاتف", 
        null=True, 
        blank=True,
        validators=[phone_validator] # تفعيل التحقق هنا
    )

    address = models.TextField(verbose_name="العنوان", null=True, blank=True)
    commercial_register = models.CharField(max_length=100, verbose_name="السجل التجاري", null=True, blank=True)
    
    logo = models.ImageField(upload_to='system_logos/', null=True, blank=True)
    enable_inventory = models.BooleanField(default=False)
    enable_sales = models.BooleanField(default=False)
    enable_employees = models.BooleanField(default=False)
    enable_accounts = models.BooleanField(default=False)
    enable_automation = models.BooleanField(default=False)
    enable_ai_assistant = models.BooleanField(default=False)

    class Meta:
        app_label = 'system_settings'

    def __str__(self):
        return self.company_name if self.company_name else "إعدادات غير مسمى"