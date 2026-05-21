from rest_framework.permissions import BasePermission
from accounts.models import RolePermission, UserPermission


def resolve_user_permissions(user):
    """
    Three-layer resolution:
    1. Role permissions (from accounts.Role via UserProfile.role_new)
    2. User-specific permissions (UserPermission.granted=True)
    3. User-specific denies (UserPermission.granted=False) — highest priority
    Returns: set of 'module:action' strings
    """
    if not user or not user.is_authenticated:
        return set()

    # Superuser bypass
    if user.is_superuser:
        from accounts.models import Permission
        all_perms = Permission.objects.values_list('module', 'action')
        return {f"{m}:{a}" for m, a in all_perms}

    permissions = set()

    # Layer 1: Role permissions via UserProfile.role_new
    try:
        role = user.userprofile.role_new
        if role:
            # Superuser-equivalent: مدير with level=0
            if role.level == 0:
                from accounts.models import Permission
                all_perms = Permission.objects.values_list('module', 'action')
                return {f"{m}:{a}" for m, a in all_perms}
            # Regular role permissions
            role_perms = RolePermission.objects.filter(
                role=role
            ).select_related('permission')
            for rp in role_perms:
                permissions.add(f"{rp.permission.module}:{rp.permission.action}")
    except Exception:
        pass

    # Layer 2 & 3: User-specific overrides
    try:
        user_perms = UserPermission.objects.filter(
            user=user
        ).select_related('permission')
        for up in user_perms:
            code = f"{up.permission.module}:{up.permission.action}"
            if up.granted:
                permissions.add(code)
            else:
                permissions.discard(code)  # explicit deny
    except Exception:
        pass

    return permissions


def has_permission(user, module, action):
    """Single permission check — main entry point"""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    # Fast path: check role level=0 (مدير)
    try:
        role = user.userprofile.role_new
        if role and role.level == 0:
            return True
    except Exception:
        pass
    return f"{module}:{action}" in resolve_user_permissions(user)


class RequirePermission(BasePermission):
    """
    Usage on ViewSet:
        permission_classes = [IsAuthenticated, RequirePermission]
        required_permission = ('inventory', 'view')
    """
    module = None
    action_name = None

    def has_permission(self, request, view):
        module = getattr(view, 'required_module', self.module)
        action = getattr(view, 'required_action', self.action_name)
        if not module or not action:
            return False
        return has_permission(request.user, module, action)


# ── Concrete permission classes (drop-in for existing views) ──

class CanViewDashboard(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'dashboard', 'view')


class CanUsePOS(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'pos', 'view')


class CanCreateSale(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'pos', 'create')


class CanViewInventory(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'inventory', 'view')


class CanManageInventory(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'inventory', 'edit')


class CanViewReports(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'reports', 'view')


class CanViewTreasury(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'treasury', 'view')


class CanManageTreasury(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'treasury', 'create')


class CanManageUsers(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'users', 'view')


class CanManageRoles(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_permission(request.user, 'roles', 'manage_permissions')
