from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from customers.views import CustomerViewSet, UserViewSet, login_view
from accounts.views import SystemAnomalyViewSet
from system_settings.views import SystemSettingsViewSet
from inventory.views import (
    ProductViewSet,
    InvoiceViewSet,
    WorkShiftViewSet,
    InstallmentViewSet,
    SupplierViewSet,
    PurchaseViewSet,
    ExpenseViewSet,
    TreasuryViewSet,
    StockMovementViewSet,
    EmployeeViewSet,
    SalesRepresentativeViewSet,
    DashboardViewSet,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'users', UserViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'shifts', WorkShiftViewSet)
router.register(r'installments', InstallmentViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'purchases', PurchaseViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'treasury', TreasuryViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'representatives', SalesRepresentativeViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'anomalies', SystemAnomalyViewSet, basename='anomalies')
router.register(r'settings', SystemSettingsViewSet, basename='settings')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/login/', login_view, name='login'),
    path('api/ai/', include('ai_assistant.urls')),
    path('api/', include(router.urls)),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
