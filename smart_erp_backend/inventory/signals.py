from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Invoice, Purchase, Treasury

@receiver(post_save, sender=Invoice)
def update_treasury_on_sale(sender, instance, created, **kwargs):
    """تحديث الخزينة عند إصدار فاتورة بيع"""
    if created:
        # بنزود الخزينة بقيمة الفاتورة
        treasury, _ = Treasury.objects.get_or_create(id=1)
        treasury.amount += instance.total
        treasury.save()

@receiver(post_save, sender=Purchase)
def update_treasury_on_purchase(sender, instance, created, **kwargs):
    """تحديث الخزينة عند إضافة عملية شراء بضاعة"""
    if created:
        # بنخصم من الخزينة قيمة المشتريات (سعر التكلفة * الكمية)
        amount_to_deduct = instance.quantity * instance.cost_price
        treasury, _ = Treasury.objects.get_or_create(id=1)
        treasury.amount -= amount_to_deduct
        treasury.save()