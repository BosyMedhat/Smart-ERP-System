from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Purchase, Treasury, SaleItem, Sale

# ─────────────────────────────────────────────────────────────
# ERP-CORE-STABILIZATION-001: LEGACY WRITERS DISABLED
# The authoritative financial record is treasury.TreasuryTransaction
# (see treasury/signals.py). The flat-Treasury writers below produced
# duplicate postings alongside the ledger and are retained for
# history only — they execute no writes.
# ─────────────────────────────────────────────────────────────

@receiver(post_save, sender=Purchase)
def update_treasury_on_purchase(sender, instance, created, **kwargs):
    """تحديث الخزينة عند إضافة عملية شراء بضاعة — DISABLED (treasury/signals.py writes the ledger)"""
    return
    if created:
        # بنخصم من الخزينة قيمة المشتريات (سعر التكلفة * الكمية)
        amount_to_deduct = instance.quantity * instance.cost_price
        Treasury.objects.create(
            transaction_type='خرج',
            amount=amount_to_deduct,
            reason=f"مشتريات: {instance.product} كمية {instance.quantity}"
        )


@receiver(post_save, sender=SaleItem)
def deduct_stock_on_sale(sender, instance, created, **kwargs):
    """تحديث المخزون عند إتمام عملية بيع - مع التحقق من الكمية"""
    return  # disabled: stock deduction moved to SaleViewSet.perform_create()
    if created and instance.product:
        product = instance.product
        if product.current_stock >= instance.quantity:
            product.current_stock -= instance.quantity
            product.save()
        else:
            raise ValueError(
                f'المخزون غير كافٍ للمنتج: {product.name} '
                f'(المطلوب: {instance.quantity}, المتاح: {product.current_stock})'
            )


@receiver(post_save, sender=Sale)
def update_treasury_on_cash_sale(sender, instance, created, **kwargs):
    """تحديث الخزينة فقط للمبيعات الكاش — DISABLED (treasury/signals.py writes the ledger)"""
    return
    if created and instance.payment_type == 'cash':
        Treasury.objects.create(
            transaction_type='دخل',
            amount=instance.final_amount,
            reason=f"مبيعات كاش - فاتورة رقم: {instance.invoice_number}"
        )


@receiver(post_save, sender=Sale)
def update_customer_balance_on_credit(sender, instance, created, **kwargs):
    """زيادة رصيد العميل عند البيع الآجل — DISABLED (SaleViewSet.perform_create writes it once)"""
    return
    if created and instance.payment_type == 'credit' and instance.customer:
        customer = instance.customer
        customer.balance = Decimal(str(customer.balance)) + Decimal(str(instance.final_amount))
        customer.save()
