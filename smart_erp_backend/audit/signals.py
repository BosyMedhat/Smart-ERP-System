from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User

from inventory.models import (
    Sale, Purchase, Product, Expense,
    Employee, UserProfile, StoreSettings, Supplier
)
from hr.models import PayrollRun
from customers.models import Customer
from .utils import log_action


# ─────────────────────────────────────
# Helper: استخراج الـ changes بين قيمتين
# ─────────────────────────────────────
def get_changes(old_instance, new_instance):
    """مقارنة الـ instance القديم بالجديد وإرجاع التغييرات"""
    changes = {}
    try:
        fields = [f.name for f in new_instance._meta.fields
                  if f.name not in ('id', 'created_at', 'updated_at')]
        for field in fields:
            old_val = getattr(old_instance, field, None)
            new_val = getattr(new_instance, field, None)
            if str(old_val) != str(new_val):
                changes[field] = {
                    'from': str(old_val),
                    'to':   str(new_val),
                }
    except Exception:
        pass
    return changes


# ─────────────────────────────────────
# Cache للـ instances القديمة (pre_save)
# ─────────────────────────────────────
_pre_save_cache = {}


def cache_old_instance(sender, instance, **kwargs):
    """يحفظ نسخة من الـ instance قبل الحفظ للمقارنة لاحقاً"""
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            _pre_save_cache[f"{sender.__name__}_{instance.pk}"] = old
        except sender.DoesNotExist:
            pass


# ─────────────────────────────────────
# Sale — فواتير البيع
# ─────────────────────────────────────
@receiver(post_save, sender=Sale)
def audit_sale(sender, instance, created, **kwargs):
    try:
        action = 'CREATE' if created else 'UPDATE'
        log_action(
            action=action,
            model_name='Sale',
            object_id=instance.pk,
            object_repr=f'فاتورة {instance.invoice_number} — {instance.final_amount} ج.م',
            extra_data={
                'payment_type': instance.payment_type,
                'final_amount': str(instance.final_amount),
                'customer': str(instance.customer) if instance.customer else None,
            },
        )
    except Exception:
        pass


@receiver(post_delete, sender=Sale)
def audit_sale_delete(sender, instance, **kwargs):
    try:
        log_action(
            action='DELETE',
            model_name='Sale',
            object_id=instance.pk,
            object_repr=f'فاتورة {instance.invoice_number}',
        )
    except Exception:
        pass


# ─────────────────────────────────────
# Product — المنتجات
# ─────────────────────────────────────
pre_save.connect(
    lambda sender, instance, **kwargs: cache_old_instance(sender, instance, **kwargs),
    sender=Product,
    weak=False,
)


@receiver(post_save, sender=Product)
def audit_product(sender, instance, created, **kwargs):
    try:
        action = 'CREATE' if created else 'UPDATE'
        changes = {}
        if not created:
            key = f"Product_{instance.pk}"
            old = _pre_save_cache.pop(key, None)
            if old:
                changes = get_changes(old, instance)

        log_action(
            action=action,
            model_name='Product',
            object_id=instance.pk,
            object_repr=f'{instance.name} — {instance.retail_price} ج.م',
            changes=changes,
            extra_data={
                'retail_price': str(instance.retail_price),
                'cost_price':   str(instance.cost_price),
                'stock':        str(instance.current_stock),
            },
        )
    except Exception:
        pass


@receiver(post_delete, sender=Product)
def audit_product_delete(sender, instance, **kwargs):
    try:
        log_action(
            action='DELETE',
            model_name='Product',
            object_id=instance.pk,
            object_repr=instance.name,
        )
    except Exception:
        pass


# ─────────────────────────────────────
# Purchase — المشتريات
# ─────────────────────────────────────
@receiver(post_save, sender=Purchase)
def audit_purchase(sender, instance, created, **kwargs):
    try:
        if not created:
            return
        log_action(
            action='CREATE',
            model_name='Purchase',
            object_id=instance.pk,
            object_repr=f'شراء {instance.product.name if instance.product else ""} من {instance.supplier.name if instance.supplier else ""}',
            extra_data={
                'quantity':   str(instance.quantity),
                'cost_price': str(instance.cost_price),
                'total':      str(instance.total_amount),
            },
        )
    except Exception:
        pass


# ─────────────────────────────────────
# Expense — المصروفات
# ─────────────────────────────────────
@receiver(post_save, sender=Expense)
def audit_expense(sender, instance, created, **kwargs):
    try:
        if not created:
            return
        log_action(
            action='CREATE',
            model_name='Expense',
            object_id=instance.pk,
            object_repr=f'{instance.type} — {instance.amount} ج.م',
            extra_data={
                'category': instance.category,
                'amount':   str(instance.amount),
            },
        )
    except Exception:
        pass


# ─────────────────────────────────────
# Employee — الموظفون
# ─────────────────────────────────────
pre_save.connect(
    lambda sender, instance, **kwargs: cache_old_instance(sender, instance, **kwargs),
    sender=Employee,
    weak=False,
)


@receiver(post_save, sender=Employee)
def audit_employee(sender, instance, created, **kwargs):
    try:
        action = 'CREATE' if created else 'UPDATE'
        changes = {}
        if not created:
            key = f"Employee_{instance.pk}"
            old = _pre_save_cache.pop(key, None)
            if old:
                changes = get_changes(old, instance)

        log_action(
            action=action,
            model_name='Employee',
            object_id=instance.pk,
            object_repr=f'{instance.name} — {instance.position}',
            changes=changes,
            extra_data={
                'position':    instance.position,
                'base_salary': str(instance.baseSalary),
            },
        )
    except Exception:
        pass


@receiver(post_delete, sender=Employee)
def audit_employee_delete(sender, instance, **kwargs):
    try:
        log_action(
            action='DELETE',
            model_name='Employee',
            object_id=instance.pk,
            object_repr=f'{instance.name} — {instance.position}',
        )
    except Exception:
        pass


# ─────────────────────────────────────
# PayrollRun — مسير الرواتب
# ─────────────────────────────────────
@receiver(post_save, sender=PayrollRun)
def audit_payroll(sender, instance, created, **kwargs):
    try:
        action = 'CREATE' if created else 'UPDATE'
        log_action(
            action=action,
            model_name='PayrollRun',
            object_id=instance.pk,
            object_repr=f'مسير رواتب {instance.month}/{instance.year} — {instance.status}',
            extra_data={
                'month':      instance.month,
                'year':       instance.year,
                'status':     instance.status,
                'total_net':  str(instance.total_net),
            },
        )
    except Exception:
        pass


# ─────────────────────────────────────
# StoreSettings — إعدادات المتجر
# ─────────────────────────────────────
pre_save.connect(
    lambda sender, instance, **kwargs: cache_old_instance(sender, instance, **kwargs),
    sender=StoreSettings,
    weak=False,
)


@receiver(post_save, sender=StoreSettings)
def audit_settings(sender, instance, created, **kwargs):
    try:
        changes = {}
        if not created:
            key = f"StoreSettings_{instance.pk}"
            old = _pre_save_cache.pop(key, None)
            if old:
                changes = get_changes(old, instance)

        log_action(
            action='UPDATE',
            model_name='StoreSettings',
            object_id=instance.pk,
            object_repr='إعدادات المتجر',
            changes=changes,
        )
    except Exception:
        pass


# ─────────────────────────────────────
# Customer — العملاء
# ─────────────────────────────────────
@receiver(post_save, sender=Customer)
def audit_customer(sender, instance, created, **kwargs):
    try:
        action = 'CREATE' if created else 'UPDATE'
        log_action(
            action=action,
            model_name='Customer',
            object_id=instance.pk,
            object_repr=f'{instance.name} — {instance.phone or ""}',
            extra_data={'balance': str(instance.balance)},
        )
    except Exception:
        pass


@receiver(post_delete, sender=Customer)
def audit_customer_delete(sender, instance, **kwargs):
    try:
        log_action(
            action='DELETE',
            model_name='Customer',
            object_id=instance.pk,
            object_repr=instance.name,
        )
    except Exception:
        pass


# ─────────────────────────────────────
# Supplier — الموردون
# ─────────────────────────────────────
@receiver(post_save, sender=Supplier)
def audit_supplier(sender, instance, created, **kwargs):
    try:
        action = 'CREATE' if created else 'UPDATE'
        log_action(
            action=action,
            model_name='Supplier',
            object_id=instance.pk,
            object_repr=f'{instance.name}',
        )
    except Exception:
        pass


@receiver(post_delete, sender=Supplier)
def audit_supplier_delete(sender, instance, **kwargs):
    try:
        log_action(
            action='DELETE',
            model_name='Supplier',
            object_id=instance.pk,
            object_repr=instance.name,
        )
    except Exception:
        pass


# ─────────────────────────────────────
# UserProfile — تغيير الصلاحيات
# ─────────────────────────────────────
pre_save.connect(
    lambda sender, instance, **kwargs: cache_old_instance(sender, instance, **kwargs),
    sender=UserProfile,
    weak=False,
)


@receiver(post_save, sender=UserProfile)
def audit_userprofile(sender, instance, created, **kwargs):
    try:
        changes = {}
        if not created:
            key = f"UserProfile_{instance.pk}"
            old = _pre_save_cache.pop(key, None)
            if old:
                changes = get_changes(old, instance)

        action = 'CREATE' if created else 'UPDATE'
        log_action(
            action=action,
            model_name='UserProfile',
            object_id=instance.pk,
            object_repr=f'{instance.user.username} — {instance.role}',
            changes=changes,
            extra_data={'role': instance.role},
        )
    except Exception:
        pass
