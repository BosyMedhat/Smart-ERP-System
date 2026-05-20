from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from treasury.models import TreasuryAccount, TreasuryTransaction


class TreasuryTransactionTest(TestCase):

    def setUp(self):
        self.account = TreasuryAccount.objects.create(
            name='CASH',
            display_name='الخزينة النقدية',
            balance=Decimal('0'),
        )

    def test_income_increases_balance(self):
        TreasuryTransaction.objects.create(
            account=self.account,
            transaction_type='INCOME',
            category='SALE',
            amount=Decimal('500'),
            description='اختبار دخل',
            is_auto=False,
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('500'))

    def test_expense_decreases_balance(self):
        self.account.balance = Decimal('1000')
        self.account.save()

        TreasuryTransaction.objects.create(
            account=self.account,
            transaction_type='EXPENSE',
            category='PURCHASE',
            amount=Decimal('300'),
            description='اختبار خرج',
            is_auto=False,
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('700'))

    def test_balance_after_is_correct(self):
        t = TreasuryTransaction.objects.create(
            account=self.account,
            transaction_type='INCOME',
            category='MANUAL',
            amount=Decimal('250'),
            description='اختبار balance_after',
            is_auto=False,
        )
        self.assertEqual(t.balance_after, Decimal('250'))
