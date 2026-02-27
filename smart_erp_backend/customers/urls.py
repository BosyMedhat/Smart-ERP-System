from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet # تأكدي إن الكلاس ده موجود في views.py هناك

router = DefaultRouter()
router.register(r'list', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]