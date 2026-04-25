from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, 
    InvoiceViewSet, 
    WorkShiftViewSet, 
    SupplierViewSet, 
    PurchaseViewSet, 
    ExpenseViewSet, 
    TreasuryViewSet, 
    StockMovementViewSet,
    InstallmentViewSet,
    EmployeeViewSet  # 1. تم إضافة الموظفين هنا 
)

# إنشاء الراوتر الخاص بالنظام
router = DefaultRouter()

# تسجيل العمليات (Routes)
router.register(r'products', ProductViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'shifts', WorkShiftViewSet)
router.register(r'installments', InstallmentViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'purchases', PurchaseViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'treasury', TreasuryViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'employees', EmployeeViewSet) # 3. تسجيل مسار الموظفين 

urlpatterns = [
    path('', include(router.urls)),
]