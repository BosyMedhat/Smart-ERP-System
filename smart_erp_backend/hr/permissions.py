"""
HR permission classes — ERP-CORE-STABILIZATION-001.

Maps ViewSet actions to the RBAC hr:* module permissions
(sync_permissions.py). Replaces the bare IsAuthenticated that
let any logged-in user write payroll, attendance and employee records.
"""
from rest_framework.permissions import BasePermission
from accounts.permissions import has_permission


# action → required hr:* permission
HR_ACTION_MAP = {
    'list':            'hr:view',
    'retrieve':        'hr:view',
    'employee_summary':'hr:view',
    'payment_history': 'hr:view',
    'create':          'hr:create',
    'bulk_record':     'hr:create',
    'update':          'hr:edit',
    'partial_update':  'hr:edit',
    'destroy':         'hr:delete',
    # payroll-specific sensitive actions
    'generate_slips':  'hr:payroll',
    'approve':         'hr:payroll',
    'mark_paid':       'hr:payroll',
}


class HRModulePermission(BasePermission):
    """
    Requires the matching hr:* RBAC permission for the current
    viewset action. Superusers and the level-0 مدير role pass via
    accounts.permissions.has_permission.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        action = getattr(view, 'action', None)
        required = HR_ACTION_MAP.get(action)
        if not required:
            # Unknown/custom action — deny by default
            return False

        module, _, perm_action = required.partition(':')
        return has_permission(request.user, module, perm_action)


# Backwards-compat alias used by EmployeeViewSet in inventory
EmployeeRecordPermission = HRModulePermission
