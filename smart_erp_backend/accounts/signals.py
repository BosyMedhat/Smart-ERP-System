from django.db.models.signals import pre_save, post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from inventory.models import Product, Invoice
from system_settings.models import SystemSettings
from .models import SystemAnomaly

# 1. مراقبة تغيير سعر المنتج (Price Change)
@receiver(pre_save, sender=Product)
def track_price_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Product.objects.get(pk=instance.pk)
            if old_instance.retail_price != instance.retail_price:
                SystemAnomaly.objects.create(
                    operation_type="تعديل سعر منتج",
                    old_value=str(old_instance.retail_price),
                    new_value=str(instance.retail_price),
                    reason=f"تم تعديل سعر الصنف {instance.name}",
                    severity="medium",
                    employee_name="مدير المخزن" # في المرحلة دي بنثبت الاسم، وفي الحقيقي بنجيبه من الـ request
                )
        except Product.DoesNotExist:
            pass

# 2. مراقبة الفواتير (خصم كبير + خارج الدوام)
@receiver(post_save, sender=Invoice)
def monitor_invoice_creation(sender, instance, created, **kwargs):
    if created:
        # أ - فحص الخصم الكبير (بناءً على الإعدادات)
        settings = SystemSettings.get_settings()
        total_before_discount = instance.total + instance.discount_amount
        if total_before_discount > 0:
            discount_percentage = (instance.discount_amount / total_before_discount) * 100
            if discount_percentage > settings.max_cashier_discount:
                SystemAnomaly.objects.create(
                    operation_type="خصم استثنائي",
                    value=float(instance.total),
                    reason=f"تجاوز الخصم الحد المسموح ({settings.max_cashier_discount}%) حيث بلغت النسبة {discount_percentage:.1f}%",
                    severity="high",
                    employee_name=instance.shift.user.username if instance.shift else "كاشير"
                )

        # ب - فحص العمليات خارج الدوام (بناءً على الإعدادات)
        current_time = timezone.localtime(instance.created_at).time()
        start_time = settings.work_start_time
        end_time = settings.work_end_time
        
        if current_time < start_time or current_time > end_time:
            SystemAnomaly.objects.create(
                operation_type="عملية بيع خارج الدوام",
                value=float(instance.total),
                reason=f"تمت العملية في الساعة {current_time.strftime('%H:%M')} (خارج ساعات العمل {start_time}-{end_time})",
                severity="low",
                employee_name=instance.shift.user.username if instance.shift else "كاشير"
            )

# 3. مراقبة حذف الفواتير (Invoice Deletion)
@receiver(pre_delete, sender=Invoice)
def track_invoice_deletion(sender, instance, **kwargs):
    SystemAnomaly.objects.create(
        operation_type="حذف فاتورة",
        value=float(instance.total),
        reason=f"حذف فاتورة قيمة {instance.total} ج.م (رقم: {instance.invoice_number})",
        severity="high",
        employee_name="مدير النظام"
    )
