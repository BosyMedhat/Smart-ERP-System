from rest_framework.permissions import BasePermission

TREASURY_ROLES = ['مدير', 'محاسب']
TREASURY_WRITE_ROLES = ['مدير']


def get_role(user):
    try:
        return user.userprofile.role
    except Exception:
        return None


class CanViewTreasury(BasePermission):
    """مدير + محاسب يشوفون الخزينة"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return get_role(request.user) in TREASURY_ROLES


class CanManageTreasuryFull(BasePermission):
    """مدير فقط يكتب + يعدّل"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return get_role(request.user) in TREASURY_WRITE_ROLES
