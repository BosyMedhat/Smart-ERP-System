from django.db import models

class SystemConfiguration(models.Model):
    # الحقول بتاعتك زي ما هي
    company_name = models.CharField(max_length=255, verbose_name="اسم المؤسسة", null=True, blank=True)
    phone_number = models.CharField(max_length=20, verbose_name="رقم الهاتف", null=True, blank=True)
    address = models.TextField(verbose_name="العنوان", null=True, blank=True)
    commercial_register = models.CharField(max_length=100, verbose_name="السجل التجاري", null=True, blank=True)
    
    logo = models.ImageField(upload_to='system_logos/', null=True, blank=True)
    enable_inventory = models.BooleanField(default=False)
    enable_sales = models.BooleanField(default=False)
    enable_employees = models.BooleanField(default=False)
    enable_accounts = models.BooleanField(default=False)
    enable_automation = models.BooleanField(default=False)
    enable_ai_assistant = models.BooleanField(default=False)

    # --- الجزء اللي هنضيفه هنا ---
    class Meta:
        app_label = 'system_settings'
    # ---------------------------

    def __str__(self):
        return self.company_name if self.company_name else "إعدادات غير مسمى"