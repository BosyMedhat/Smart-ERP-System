from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role, Permission, RolePermission
from accounts.serializers import RoleSerializer, PermissionSerializer
from accounts.permissions import CanManageRoles


class RoleViewSet(viewsets.ModelViewSet):
    """
    CRUD for roles.
    - GET list/detail: requires roles:view
    - POST/PUT/PATCH/DELETE: requires roles:manage_permissions
    - DELETE: blocked for is_system=True roles
    """
    queryset = Role.objects.all().order_by('level')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.is_system:
            return Response(
                {'error': 'لا يمكن حذف الأدوار الأساسية للنظام'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        """GET /api/accounts/roles/{id}/permissions/"""
        role = self.get_object()
        perms = Permission.objects.filter(
            role_permissions__role=role
        ).order_by('module', 'action')
        return Response(PermissionSerializer(perms, many=True).data)

    @action(detail=True, methods=['post'])
    def assign_permission(self, request, pk=None):
        """
        POST /api/accounts/roles/{id}/assign_permission/
        Body: {"permission_id": <int>}
        """
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        if not permission_id:
            return Response(
                {'error': 'permission_id مطلوب'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            perm = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            return Response(
                {'error': 'الصلاحية غير موجودة'},
                status=status.HTTP_404_NOT_FOUND
            )
        _, created = RolePermission.objects.get_or_create(
            role=role, permission=perm
        )
        return Response({
            'status':  'assigned' if created else 'already_exists',
            'role':    role.name,
            'permission': f"{perm.module}:{perm.action}",
        })

    @action(detail=True, methods=['post'])
    def revoke_permission(self, request, pk=None):
        """
        POST /api/accounts/roles/{id}/revoke_permission/
        Body: {"permission_id": <int>}
        """
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        if not permission_id:
            return Response(
                {'error': 'permission_id مطلوب'},
                status=status.HTTP_400_BAD_REQUEST
            )
        deleted, _ = RolePermission.objects.filter(
            role=role, permission_id=permission_id
        ).delete()
        if deleted:
            return Response({'status': 'revoked'})
        return Response(
            {'error': 'الصلاحية لم تكن مُعيَّنة لهذا الدور'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def bulk_update_permissions(self, request, pk=None):
        """
        POST /api/accounts/roles/{id}/bulk_update_permissions/
        Body: {"permission_ids": [1, 2, 3, ...]}
        Replaces ALL permissions for this role with the given list.
        Blocked for is_system=True if permission_ids is empty.
        """
        role = self.get_object()
        permission_ids = request.data.get('permission_ids', [])

        if role.is_system and len(permission_ids) == 0:
            return Response(
                {'error': 'لا يمكن إزالة كل صلاحيات دور أساسي'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate all permission IDs exist
        perms = Permission.objects.filter(id__in=permission_ids)
        if len(perms) != len(permission_ids):
            return Response(
                {'error': 'بعض معرفات الصلاحيات غير صحيحة'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Replace
        RolePermission.objects.filter(role=role).delete()
        RolePermission.objects.bulk_create([
            RolePermission(role=role, permission=p)
            for p in perms
        ])

        return Response({
            'status': 'updated',
            'role': role.name,
            'permissions_count': len(perms),
        })


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only list of all permissions.
    Grouped by module for the UI.
    """
    queryset = Permission.objects.all().order_by('module', 'action')
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]

    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """GET /api/accounts/permissions/grouped/"""
        all_perms = Permission.objects.all().order_by('module', 'action')
        grouped = {}
        for perm in all_perms:
            if perm.module not in grouped:
                grouped[perm.module] = []
            grouped[perm.module].append(
                PermissionSerializer(perm).data
            )
        return Response(grouped)
