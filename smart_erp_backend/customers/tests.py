"""
ERP-CORE-STABILIZATION-001 regression tests — customers & user management.

Covers: debt collection → ledger posting, overcollection prevention,
user password handling, privilege-escalation guards.
"""
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from customers.models import Customer
from inventory.models import UserProfile
from treasury.models import TreasuryAccount, TreasuryTransaction


def make_user(username, role=None, role_new=None, is_superuser=False,
              is_staff=False):
    u = User.objects.create_user(
        username=username, password='testpass123',
        is_superuser=is_superuser, is_staff=is_staff,
    )
    profile, _ = UserProfile.objects.get_or_create(user=u)
    if role:
        profile.role = role
    if role_new:
        profile.role_new = role_new
    profile.save()
    # re-fetch: the post_save signal cached a stale profile on `u`
    return User.objects.get(pk=u.pk)


def authed_client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


# ────────────────────────────────────────────────────────────────
# STEP 4 — Customer debt collection → treasury ledger
# ────────────────────────────────────────────────────────────────
class CustomerCollectTest(TestCase):

    def setUp(self):
        call_command('sync_permissions', verbosity=0)
        self.cashier_role = Role.objects.get(name='كاشير')
        self.cashier = make_user(
            'collector', role='كاشير', role_new=self.cashier_role)
        self.manager = make_user('mgr_coll', is_superuser=True)
        self.customer = Customer.objects.create(
            name='مدين', phone='01000000002', balance=Decimal('200'))

    def test_collect_posts_ledger_and_reduces_balance(self):
        res = authed_client(self.cashier).post(
            f'/api/customers/{self.customer.pk}/collect/',
            {'amount': '120', 'payment_method': 'cash'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)

        self.customer.refresh_from_db()
        self.assertEqual(self.customer.balance, Decimal('80'))

        txn = TreasuryTransaction.objects.get(
            reference_type='customer_collection',
            reference_id=self.customer.pk)
        self.assertEqual(txn.transaction_type, 'INCOME')
        self.assertEqual(txn.category, 'COLLECTION')
        self.assertEqual(txn.amount, Decimal('120'))
        self.assertEqual(txn.account.name, 'CASH')
        # account balance reflects the collection
        self.assertEqual(txn.account.balance, Decimal('120'))

    def test_collect_to_vodafone_account(self):
        res = authed_client(self.cashier).post(
            f'/api/customers/{self.customer.pk}/collect/',
            {'amount': '50', 'payment_method': 'vodafone_cash'},
            format='json')
        self.assertEqual(res.status_code, 200)
        txn = TreasuryTransaction.objects.get(
            reference_type='customer_collection',
            reference_id=self.customer.pk)
        self.assertEqual(txn.account.name, 'VODAFONE')

    def test_overcollection_rejected_and_atomic(self):
        res = authed_client(self.cashier).post(
            f'/api/customers/{self.customer.pk}/collect/',
            {'amount': '999'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.balance, Decimal('200'))
        self.assertEqual(TreasuryTransaction.objects.count(), 0)

    def test_zero_and_negative_amounts_rejected(self):
        client = authed_client(self.cashier)
        for bad in ['0', '-50']:
            res = client.post(
                f'/api/customers/{self.customer.pk}/collect/',
                {'amount': bad}, format='json')
            self.assertEqual(res.status_code, 400)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.balance, Decimal('200'))

    def test_invalid_payment_method_rejected(self):
        res = authed_client(self.cashier).post(
            f'/api/customers/{self.customer.pk}/collect/',
            {'amount': '10', 'payment_method': 'bitcoin'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(TreasuryTransaction.objects.count(), 0)

    def test_collect_denied_without_permission(self):
        nobody = make_user('noperm')  # authenticated, no role_new, no perms
        res = authed_client(nobody).post(
            f'/api/customers/{self.customer.pk}/collect/',
            {'amount': '10'}, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(TreasuryTransaction.objects.count(), 0)


# ────────────────────────────────────────────────────────────────
# STEP 7 — User management security
# ────────────────────────────────────────────────────────────────
class UserManagementSecurityTest(TestCase):

    def setUp(self):
        call_command('sync_permissions', verbosity=0)
        self.manager = make_user('mgr_users', is_staff=True)
        self.cashier = make_user('cashier_users', role='كاشير')

    def test_create_user_hashes_password(self):
        res = authed_client(self.manager).post('/api/users/', {
            'username': 'newguy', 'password': 'secret!23',
            'profile': {'role': 'كاشير'},
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        # password never returned
        self.assertNotIn('password', res.data)
        self.assertNotIn('secret', str(res.data))
        new_user = User.objects.get(username='newguy')
        self.assertTrue(new_user.check_password('secret!23'))
        self.assertNotEqual(new_user.password, 'secret!23')

    def test_password_update_hashes_and_preserves_others(self):
        target = make_user('target_user', role='كاشير')
        old_hash = target.password
        # unrelated update must NOT corrupt the hash
        res = authed_client(self.manager).patch(
            f'/api/users/{target.pk}/', {'first_name': 'T'}, format='json')
        self.assertEqual(res.status_code, 200)
        target.refresh_from_db()
        self.assertEqual(target.password, old_hash)
        # explicit password change hashes correctly
        res = authed_client(self.manager).patch(
            f'/api/users/{target.pk}/',
            {'password': 'newpass!9'}, format='json')
        self.assertEqual(res.status_code, 200)
        target.refresh_from_db()
        self.assertTrue(target.check_password('newpass!9'))
        self.assertNotIn('password', res.data)

    def test_non_manager_cannot_manage_users(self):
        client = authed_client(self.cashier)
        self.assertEqual(client.get('/api/users/').status_code, 403)
        res = client.post('/api/users/', {
            'username': 'hacked', 'password': 'x'}, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertFalse(User.objects.filter(username='hacked').exists())

    def test_self_role_change_blocked(self):
        res = authed_client(self.manager).patch(
            f'/api/users/{self.manager.pk}/',
            {'profile': {'role': 'كاشير'}}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_self_delete_blocked(self):
        res = authed_client(self.manager).delete(
            f'/api/users/{self.manager.pk}/')
        self.assertEqual(res.status_code, 400)
        self.assertTrue(User.objects.filter(pk=self.manager.pk).exists())

    def test_non_superuser_cannot_grant_manager_role(self):
        plain_manager = make_user('plain_mgr', role='مدير')  # role but not superuser
        res = authed_client(plain_manager).post('/api/users/', {
            'username': 'sneaky', 'password': 'x9',
            'profile': {'role': 'مدير'},
        }, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertFalse(User.objects.filter(username='sneaky').exists())

    def test_login_still_works_after_changes(self):
        res = APIClient().post('/api/login/', {
            'username': 'cashier_users', 'password': 'testpass123',
        }, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertIn('token', res.data)
