from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction as db_transaction

from inventory.models import Sale, Purchase, Expense
from hr.models import PayrollRun
from .models import TreasuryAccount, TreasuryTransaction


PAYMENT_TO_ACCOUNT = {
    'cash':          'CASH',
    'vodafone_cash': 'VODAFONE',
    'instapay':      'INSTAPAY',
    'card':          'CARD',
}


def _get_account(name: str):
    account, _ = TreasuryAccount.objects.get_or_create(
        name=name,
        defaults={'display_name': name, 'balance': Decimal('0')}
    )
    return account


def _create_transaction(account, t_type, category, amount,
                         description, ref_type, ref_id, user=None):
    with db_transaction.atomic():
        acc = TreasuryAccount.objects.select_for_update().get(pk=account.pk)
        amount = Decimal(str(amount))

        if t_type == 'INCOME':
            acc.balance += amount
        elif t_type == 'EXPENSE':
            acc.balance -= amount

        acc.save()

        TreasuryTransaction.objects.create(
            account=acc,
            transaction_type=t_type,
            category=category,
            amount=amount,
            balance_after=acc.balance,
            description=description,
            reference_type=ref_type,
            reference_id=ref_id,
            created_by=user,
            is_auto=True,
        )


@receiver(post_save, sender=Sale)
def handle_sale_treasury(sender, instance, created, **kwargs):
    if not created:
        return

    payment_type = instance.payment_type
    amount = Decimal(str(instance.final_amount))
    user = instance.cashier

    if payment_type == 'credit':
        return

    if payment_type == 'installment':
        # ISS-08 FIX: down_payment Treasury recording moved to
        # SaleViewSet.perform_create() where it runs AFTER Installment.objects.create().
        # Recording here caused a race condition: signal fired before the
        # Installment record was created, so installments.first() returned None.
        return

    account_name = PAYMENT_TO_ACCOUNT.get(payment_type)
    if not account_name:
        return

    account = _get_account(account_name)
    _create_transaction(
        account=account,
        t_type='INCOME',
        category='SALE',
        amount=amount,
        description=f'مبيعات — فاتورة {instance.invoice_number}',
        ref_type='sale',
        ref_id=instance.pk,
        user=user,
    )


@receiver(post_save, sender=Purchase)
def handle_purchase_treasury(sender, instance, created, **kwargs):
    if not created:
        return

    amount = Decimal(str(instance.total_amount))
    if amount <= 0:
        return

    account = _get_account('CASH')
    supplier_name = instance.supplier.name if instance.supplier else 'مورد'

    _create_transaction(
        account=account,
        t_type='EXPENSE',
        category='PURCHASE',
        amount=amount,
        description=f'مشتريات من {supplier_name} — {instance.product.name if instance.product else ""}',
        ref_type='purchase',
        ref_id=instance.pk,
        user=None,
    )


@receiver(post_save, sender=Expense)
def handle_expense_treasury(sender, instance, created, **kwargs):
    if not created:
        return

    amount = Decimal(str(instance.amount))
    if amount <= 0:
        return

    account = _get_account('CASH')

    _create_transaction(
        account=account,
        t_type='EXPENSE',
        category=instance.category.upper() if instance.category else 'OTHER',
        amount=amount,
        description=f'مصروف — {instance.type}',
        ref_type='expense',
        ref_id=instance.pk,
        user=None,
    )


@receiver(post_save, sender=PayrollRun)
def handle_payroll_treasury(sender, instance, created, **kwargs):
    if instance.status != 'paid':
        return

    already_recorded = TreasuryTransaction.objects.filter(
        reference_type='payroll',
        reference_id=instance.pk,
        category='SALARY',
    ).exists()

    if already_recorded:
        return

    amount = Decimal(str(instance.total_net))
    if amount <= 0:
        return

    account = _get_account('CASH')

    _create_transaction(
        account=account,
        t_type='EXPENSE',
        category='SALARY',
        amount=amount,
        description=f'رواتب شهر {instance.month}/{instance.year}',
        ref_type='payroll',
        ref_id=instance.pk,
        user=instance.approved_by,
    )
