from django.contrib import admin

from .models import Role, Permission, RolePermission, UserPermission


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_en', 'level', 'is_system', 'created_at')
    list_filter = ('is_system',)
    search_fields = ('name', 'name_en', 'description')
    ordering = ('level',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('module', 'action', 'description_ar', 'created_at')
    list_filter = ('module',)
    search_fields = ('module', 'action', 'description_ar')
    ordering = ('module', 'action')


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    list_filter = ('role', 'permission__module')
    search_fields = ('role__name', 'permission__module', 'permission__action')


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'permission', 'granted')
    list_filter = ('granted', 'permission__module')
    search_fields = ('user__username', 'permission__module', 'permission__action')
