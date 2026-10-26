"""
ERP-CORE-STABILIZATION-001 regression tests — HR write permissions.

Previously every HR endpoint required only IsAuthenticated — any logged-in
user could create payroll runs, approve salaries and edit attendance.
Now gated by the RBAC hr:* permission set.
"""
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from hr.models import PayrollRun
from inventory.models import Employee, UserProfile


def make_user(username, role=None, role_new=None, is_superuser=False):
    u = User.objects.create_user(
        username=username, password='testpass123',
        is_superuser=is_superuser,
    )
    profile, _ = UserProfile.objects.get_or_create(user=u)
    if role:
        profile.role = role
    if role_new:
        profile.role_new = role_new
    profile.save()
    # re-fetch: post_save signal cached a stale userprofile on `u`
    return User.objects.get(pk=u.pk)


def authed_client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


class HRWritePermissionTest(TestCase):

    def setUp(self):
        call_command('sync_permissions', verbosity=0)
        self.manager = make_user('hr_mgr', is_superuser=True)
        self.cashier = make_user(
            'hr_cashier', role='كاشير',
            role_new=Role.objects.get(name='كاشير'))
        self.accountant = make_user(
            'hr_acct', role='محاسب',
            role_new=Role.objects.get(name='محاسب'))
        self.plain = make_user('hr_plain')  # no role at all

    def test_payroll_create_denied_for_cashier(self):
        res = authed_client(self.cashier).post(
            '/api/hr/payroll/', {'month': 6, 'year': 2026},
            format='json')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(PayrollRun.objects.count(), 0)

    def test_payroll_create_denied_for_accountant(self):
        # محاسب default perms do NOT include hr:*
        res = authed_client(self.accountant).post(
            '/api/hr/payroll/', {'month': 6, 'year': 2026},
            format='json')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(PayrollRun.objects.count(), 0)

    def test_payroll_create_allowed_for_manager(self):
        res = authed_client(self.manager).post(
            '/api/hr/payroll/', {'month': 6, 'year': 2026},
            format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(PayrollRun.objects.count(), 1)

    def test_payroll_approve_denied_for_cashier(self):
        run = PayrollRun.objects.create(month=6, year=2026)
        res = authed_client(self.cashier).post(
            f'/api/hr/payroll/{run.pk}/approve/')
        self.assertEqual(res.status_code, 403)
        run.refresh_from_db()
        self.assertEqual(run.status, 'draft')

    def test_payroll_list_denied_for_plain_user(self):
        res = authed_client(self.plain).get('/api/hr/payroll/')
        self.assertEqual(res.status_code, 403)

    def test_attendance_write_denied_for_plain_user(self):
        emp = Employee.objects.create(
            name='موظف اختبار', position='كاشير', baseSalary=1000)
        res = authed_client(self.plain).post('/api/hr/attendance/', {
            'employee': emp.pk, 'date': '2026-06-01', 'status': 'present',
        }, format='json')
        self.assertEqual(res.status_code, 403)

    def test_employee_delete_denied_for_cashier(self):
        emp = Employee.objects.create(
            name='موظف محمي', position='كاشير', baseSalary=1000)
        res = authed_client(self.cashier).delete(f'/api/employees/{emp.pk}/')
        self.assertEqual(res.status_code, 403)
        self.assertTrue(Employee.objects.filter(pk=emp.pk).exists())

    def test_unauthenticated_hr_denied(self):
        res = APIClient().get('/api/hr/payroll/')
        # 401 (token auth) or 403 — either way, denied
        self.assertIn(res.status_code, (401, 403))
