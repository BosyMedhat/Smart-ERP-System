from rest_framework import permissions

# القيم المقبولة لدور المدير — موحَّدة في مكان واحد
MANAGER_ROLES = {'مدير', 'مدير النظام'}


class RoleBasedPermission(permissions.BasePermission):
    """
    نظام صلاحيات مبني على الأدوار:
    - غير المسجَّل         → 401
    - مسجَّل بدون بروفايل  → 403
    - مدير                 → وصول كامل
    - كاشير                → قراءة فقط (GET/HEAD/OPTIONS)
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        if not hasattr(request.user, 'profile'):
            return False

        role = getattr(request.user.profile, 'role', '')

        if role in MANAGER_ROLES:
            return True

        # الكاشير: قراءة فقط
        return request.method in permissions.SAFE_METHODS
