from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from treasury.models import TreasuryAccount, TreasuryTransaction
from treasury.signals import _create_transaction, _get_account


class TreasuryTransactionTest(TestCase):
    """
    ERP-CORE-STABILIZATION-001: updated to the current ledger contract —
    TreasuryTransaction.save() does NOT mutate account.balance; balance
    updates are caller-managed under select_for_update (see
    treasury.signals._create_transaction). The old assertions assumed the
    removed auto-balance behaviour.
    """

    def setUp(self):
        self.account = TreasuryAccount.objects.create(
            name='CASH',
            display_name='الخزينة النقدية',
            balance=Decimal('0'),
        )

    def test_income_increases_balance(self):
        _create_transaction(
            self.account, 'INCOME', 'SALE', Decimal('500'),
            'اختبار دخل', 'test', 1)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('500'))

    def test_expense_decreases_balance(self):
        self.account.balance = Decimal('1000')
        self.account.save()

        _create_transaction(
            self.account, 'EXPENSE', 'PURCHASE', Decimal('300'),
            'اختبار خرج', 'test', 1)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('700'))

    def test_balance_after_is_correct(self):
        _create_transaction(
            self.account, 'INCOME', 'MANUAL', Decimal('250'),
            'اختبار balance_after', 'test', 1)
        t = TreasuryTransaction.objects.latest('id')
        self.assertEqual(t.balance_after, Decimal('250'))
