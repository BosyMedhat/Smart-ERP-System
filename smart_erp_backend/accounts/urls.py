from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.views import me_view
from accounts.api_views import RoleViewSet, PermissionViewSet

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')

urlpatterns = [
    path('me/', me_view, name='accounts-me'),
    path('', include(router.urls)),
]
