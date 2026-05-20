from rest_framework import serializers
from accounts.models import Role, Permission, RolePermission, UserPermission


class PermissionSerializer(serializers.ModelSerializer):
    full_code = serializers.SerializerMethodField()

    class Meta:
        model = Permission
        fields = ['id', 'module', 'action', 'description_ar', 'full_code']

    def get_full_code(self, obj):
        return f"{obj.module}:{obj.action}"


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'name_en', 'description',
                  'level', 'is_system', 'permissions']

    def get_permissions(self, obj):
        perms = Permission.objects.filter(
            role_permissions__role=obj
        )
        return PermissionSerializer(perms, many=True).data


class UserPermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer(read_only=True)

    class Meta:
        model = UserPermission
        fields = ['id', 'permission', 'granted']
