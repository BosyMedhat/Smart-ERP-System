from django.db import models
from django.core.cache import cache

# --- موديل إعدادات النظام الشامل (The Brain) ---
class SystemSettings(models.Model):
    # 1. بيانات المؤسسة
    company_name = models.CharField("اسم الشركة", max_length=255, default="Smart ERP System")
    company_logo = models.ImageField("شعار الشركة", upload_to='settings/', null=True, blank=True)
    company_address = models.TextField("العنوان", null=True, blank=True)
    company_phone = models.CharField("رقم الهاتف", max_length=50, null=True, blank=True)
    tax_number = models.CharField("الرقم الضريبي", max_length=50, null=True, blank=True)

    # 2. الإعدادات المالية والضرائب
    vat_percentage = models.DecimalField("نسبة الضريبة VAT (%)", max_digits=5, decimal_places=2, default=14.0)
    currency = models.CharField("العملة الأساسية", max_length=20, default="ج.م")
    payroll_tax_rate = models.DecimalField("ضريبة الرواتب (%)", max_digits=5, decimal_places=2, default=10.0)
    max_advance_limit = models.DecimalField("سقف السلف الشهرية (ج.م)", max_digits=10, decimal_places=2, default=2000.0)

    # 3. إعدادات المخزون المتقدمة
    allow_negative_stock = models.BooleanField("السماح بالبيع بالسالب", default=False)
    auto_update_retail_price = models.BooleanField("تحديث السعر التلقائي عند الشراء", default=True)
    low_stock_threshold = models.DecimalField("حد التنبيه للنواقص", max_digits=10, decimal_places=2, default=5.0)

    # 4. إعدادات التشغيل والأمان
    work_start_time = models.TimeField("بداية ساعات العمل", default="09:00:00")
    work_end_time = models.TimeField("نهاية ساعات العمل", default="23:00:00")
    max_cashier_discount = models.DecimalField("سقف خصم الكاشير المسموح (%)", max_digits=5, decimal_places=2, default=15.0)
    token_expiry_days = models.IntegerField("مدة صلاحية الجلسة (أيام)", default=7)

    # 5. تخصيص الواجهة (Look & Feel)
    primary_color = models.CharField("اللون الأساسي (Hex)", max_length=10, default="#3B82F6")
    print_logo_on_invoice = models.BooleanField("إظهار اللوجو في الفاتورة", default=True)

    class Meta:
        verbose_name = "إعدادات النظام"
        verbose_name_plural = "إعدادات النظام"

    def __str__(self):
        return "إعدادات النظام الأساسية"

    def save(self, *args, **kwargs):
        # منع إنشاء أكثر من سجل واحد (Singleton Pattern)
        self.pk = 1
        super().save(*args, **kwargs)
        # مسح الكاش عند التحديث لضمان وصول القيم الجديدة فوراً
        cache.delete('system_settings')

    @classmethod
    def get_settings(cls):
        # استدعاء الإعدادات من الكاش للحفاظ على الأداء
        settings = cache.get('system_settings')
        if not settings:
            settings, created = cls.objects.get_or_create(pk=1)
            cache.set('system_settings', settings, 3600)
        return settings
