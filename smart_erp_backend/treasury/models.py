from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class TreasuryAccount(models.Model):
    """
    حسابات الخزينة — كاش / بنك / فودافون / إنستاباي
    """
    ACCOUNT_TYPES = [
        ('CASH',      'خزينة نقدية'),
        ('BANK',      'حساب بنكي'),
        ('VODAFONE',  'فودافون كاش'),
        ('INSTAPAY',  'إنستاباي'),
        ('CARD',      'بطاقة بنكية'),
    ]

    name         = models.CharField(max_length=50, choices=ACCOUNT_TYPES, unique=True)
    display_name = models.CharField(max_length=100)
    balance      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name      = 'حساب خزينة'
        verbose_name_plural = 'حسابات الخزينة'
        ordering = ['name']

    def __str__(self):
        return f"{self.display_name} — {self.balance} ج.م"


class TreasuryTransaction(models.Model):
    """
    سجل كل الحركات المالية في النظام
    """
    TRANSACTION_TYPES = [
        ('INCOME',     'دخل'),
        ('EXPENSE',    'خرج'),
        ('ADJUSTMENT', 'تسوية'),
    ]

    CATEGORIES = [
        ('SALE',        'مبيعات'),
        ('PURCHASE',    'مشتريات'),
        ('SALARY',      'رواتب'),
        ('INSTALLMENT', 'قسط'),
        ('RENT',        'إيجار'),
        ('ELECTRICITY', 'كهرباء'),
        ('MAINTENANCE', 'صيانة'),
        ('MANUAL',      'إدخال يدوي'),
        ('OTHER',       'أخرى'),
    ]

    account          = models.ForeignKey(
                           TreasuryAccount,
                           on_delete=models.PROTECT,
                           related_name='transactions',
                           verbose_name='الحساب'
                       )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    category         = models.CharField(max_length=20, choices=CATEGORIES)
    amount           = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    description      = models.CharField(max_length=500, blank=True)
    reference_type   = models.CharField(max_length=50, blank=True)
    reference_id     = models.PositiveIntegerField(null=True, blank=True)
    created_by       = models.ForeignKey(
                           User,
                           on_delete=models.SET_NULL,
                           null=True, blank=True,
                           related_name='treasury_transactions'
                       )
    is_auto          = models.BooleanField(default=True)
    created_at       = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name        = 'حركة خزينة'
        verbose_name_plural = 'حركات الخزينة'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_transaction_type_display()} — {self.amount} — {self.account.display_name}"

    def save(self, *args, **kwargs):
        """
        ERP-FIX-001D-C: Balance is managed exclusively by callers (select_for_update).
        This save() only persists the transaction record.
        balance_after must be set by the caller before create().
        """
        super().save(*args, **kwargs)
