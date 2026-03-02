from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# 1. استيراد موديول العملاء
from customers.views import CustomerViewSet

# 2. استيراد موديول المخازن والموظفين ✅
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
    EmployeeViewSet # تم إضافة استيراد الموظفين هنا ✅
)

# إنشاء الـ Router الرئيسي للمشروع
router = DefaultRouter()

# تسجيل المسارات (Endpoints) للـ API
router.register(r'products', ProductViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'shifts', WorkShiftViewSet)
router.register(r'installments', InstallmentViewSet) 
router.register(r'suppliers', SupplierViewSet)
router.register(r'purchases', PurchaseViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'treasury', TreasuryViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'employees', EmployeeViewSet) # تم إضافة مسار الموظفين هنا ✅

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # كدة الرابط هيبقى http://127.0.0.1:8000/api/employees/
]