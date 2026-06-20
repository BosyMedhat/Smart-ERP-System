from rest_framework.permissions import BasePermission

from accounts.permissions import has_permission


class CanAccessSuppliers(BasePermission):
    """
    RBAC-aligned supplier permissions.
    Maps ViewSet actions to suppliers:view/create/edit/delete.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        action = getattr(view, 'action', None)
        if action in ['list', 'retrieve', 'recommendations', 'insights', 'evaluations']:
            return has_permission(request.user, 'suppliers', 'view')
        if action == 'create':
            return has_permission(request.user, 'suppliers', 'create')
        if action in ['update', 'partial_update']:
            return has_permission(request.user, 'suppliers', 'edit')
        if action == 'destroy':
            return has_permission(request.user, 'suppliers', 'delete')
        if action == 'pay_debt':
            return has_permission(request.user, 'suppliers', 'edit')
        return False


class IsManagerOrHasPermission(BasePermission):
    """
    مدير النظام = وصول كامل لكل شيء
    باقي الـ roles = يحتاج permission محدد
    """

    def __init__(self, required_permission=None):
        self.required_permission = required_permission

    def has_permission(self, request, view):
        # يجب أن يكون المستخدم مسجل دخول
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin/Superuser = وصول كامل تلقائياً
        if request.user.is_staff or request.user.is_superuser:
            return True

        # المدير له وصول كامل (RBAC legacy)
        try:
            profile = request.user.userprofile
            if profile.role == 'مدير':
                return True
            # باقي الـ roles تحتاج permission محدد
            if self.required_permission:
                perms = profile.permissions
                for category in perms.values():
                    if isinstance(category, list):
                        if self.required_permission in category:
                            return True
                return False
            return True
        except:
            return False


class IsManager(BasePermission):
    """مدير فقط"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin/Superuser = وصول كامل تلقائياً
        if request.user.is_staff or request.user.is_superuser:
            return True

        try:
            return request.user.userprofile.role == 'مدير'
        except:
            return False


class CanManageProducts(IsManagerOrHasPermission):
    def __init__(self):
        super().__init__(required_permission='add_product')


class CanManageInvoices(IsManagerOrHasPermission):
    def __init__(self):
        super().__init__(required_permission='add_invoice')


class CanManageEmployees(IsManagerOrHasPermission):
    def __init__(self):
        super().__init__(required_permission='employee_report')


class CanManageSuppliers(IsManagerOrHasPermission):
    def __init__(self):
        super().__init__(required_permission='manage_suppliers')


class CanViewReports(IsManagerOrHasPermission):
    def __init__(self):
        super().__init__(required_permission='profit_report')


class CanManageTreasury(IsManager):
    """الخزينة للمدير فقط"""
    pass


class CanManageUsers(IsManager):
    """إدارة المستخدمين للمدير فقط"""
    pass


def get_user_role(user):
    """Helper مركزي للحصول على الـ role"""
    try:
        return user.userprofile.role
    except Exception:
        return None

MANAGER_ROLE = 'مدير'
CASHIER_ROLE = 'كاشير'
ACCOUNTANT_ROLE = 'محاسب'
WAREHOUSE_ROLE = 'أمين مخزن'


class CanMakeSales(BasePermission):
    """كاشير + مدير فقط يقدروا يبيعوا"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = get_user_role(request.user)
        return role in [MANAGER_ROLE, CASHIER_ROLE]


class CanViewDashboard(BasePermission):
    """كل الـ roles المصرح لهم يشوفوا الداشبورد"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = get_user_role(request.user)
        return role in [MANAGER_ROLE, CASHIER_ROLE, ACCOUNTANT_ROLE, WAREHOUSE_ROLE]


class IsManagerRole(BasePermission):
    """مدير فقط — يستخدم role بدلاً من is_staff"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = get_user_role(request.user)
        return role == MANAGER_ROLE
