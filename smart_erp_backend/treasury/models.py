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
        يحسب balance_after تلقائياً ويحدّث رصيد الحساب
        """
        from decimal import Decimal
        from django.db import transaction as db_transaction
        is_new = self.pk is None

        if is_new:
            with db_transaction.atomic():
                account = TreasuryAccount.objects.select_for_update().get(pk=self.account_id)
                if self.transaction_type == 'INCOME':
                    account.balance += Decimal(str(self.amount))
                elif self.transaction_type == 'EXPENSE':
                    account.balance -= Decimal(str(self.amount))
                # ADJUSTMENT لا يغيّر الرصيد — فقط يُسجّل
                self.balance_after = account.balance
                account.save()
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)
