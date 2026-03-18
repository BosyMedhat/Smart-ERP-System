from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, InstallmentViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'installments', InstallmentViewSet) # إضافة هذا السطر

urlpatterns = [
    path('', include(router.urls)),
]