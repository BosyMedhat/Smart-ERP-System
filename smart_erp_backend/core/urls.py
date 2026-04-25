# from django.contrib import admin
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter

# # 1. استيراد موديول العملاء
# from customers.views import CustomerViewSet

# # 2. استيراد موديول المخازن والموظفين ✅
# from inventory.views import (
#     ProductViewSet, 
#     InvoiceViewSet, 
#     WorkShiftViewSet, 
#     InstallmentViewSet,
#     SupplierViewSet, 
#     PurchaseViewSet, 
#     ExpenseViewSet, 
#     TreasuryViewSet, 
#     StockMovementViewSet,
#     EmployeeViewSet # تم إضافة استيراد الموظفين هنا ✅
# )

# # إنشاء الـ Router الرئيسي للمشروع
# router = DefaultRouter()

# # تسجيل المسارات (Endpoints) للـ API
# router.register(r'products', ProductViewSet)
# router.register(r'customers', CustomerViewSet)
# router.register(r'invoices', InvoiceViewSet)
# router.register(r'shifts', WorkShiftViewSet)
# router.register(r'installments', InstallmentViewSet) 
# router.register(r'suppliers', SupplierViewSet)
# router.register(r'purchases', PurchaseViewSet)
# router.register(r'expenses', ExpenseViewSet)
# router.register(r'treasury', TreasuryViewSet)
# router.register(r'stock-movements', StockMovementViewSet)
# router.register(r'employees', EmployeeViewSet) # تم إضافة مسار الموظفين هنا ✅

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('api/', include(router.urls)), # كدة الرابط هيبقى http://127.0.0.1:8000/api/employees/
# ]






from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

<<<<<<< HEAD
# 1. استيراد موديول العملاء والمستخدمين والـ login ✅
from customers.views import CustomerViewSet, UserViewSet, login_view

# 2. استيراد موديول المخازن والموظفين
=======
# 1. استيراد موديول العملاء والـ login
from customers.views import CustomerViewSet, login_view, UserViewSet

# 2. استيراد موديول المخازن والموظفين 
>>>>>>> aab4ff3556ce39128544e4a5d5d813a3dc80987e
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
<<<<<<< HEAD
    EmployeeViewSet 
=======
    EmployeeViewSet, # تم إضافة استيراد الموظفين هنا 
    StoreSettingsViewSet, # إعدادات المتجر
    SaleViewSet,  # فواتير المبيعات الجديدة
    DashboardView  # Dashboard API
>>>>>>> aab4ff3556ce39128544e4a5d5d813a3dc80987e
)

# إنشاء الـ Router الرئيسي للمشروع
router = DefaultRouter()

# تسجيل المسارات (Endpoints) للـ API
router.register(r'products', ProductViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'users', UserViewSet) # إضافة مسار إدارة المستخدمين ✅
router.register(r'invoices', InvoiceViewSet)
router.register(r'shifts', WorkShiftViewSet)
router.register(r'installments', InstallmentViewSet) 
router.register(r'suppliers', SupplierViewSet)
router.register(r'purchases', PurchaseViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'treasury', TreasuryViewSet)
router.register(r'stock-movements', StockMovementViewSet)
<<<<<<< HEAD
router.register(r'employees', EmployeeViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # إضافة مسار تسجيل الدخول قبل الـ router urls عشان يبقى الأولوية له
    path('api/login/', login_view, name='login'), # الرابط الجديد هيبقى http://127.0.0.1:8000/api/login/ ✅
    
    path('api/', include(router.urls)), 
=======
router.register(r'employees', EmployeeViewSet) # تم إضافة مسار الموظفين هنا 
router.register(r'users', UserViewSet) # تم إضافة مسار المستخدمين هنا 
router.register(r'settings', StoreSettingsViewSet) # إعدادات المتجر
router.register(r'sales', SaleViewSet)  # فواتير المبيعات الجديدة

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', login_view, name='login'),
    path('api/', include(router.urls)), # كدة الرابط هيبقى http://127.0.0.1:8000/api/employees/
    path('api/ai/', include('ai_assistant.urls')),
    path('api/dashboard/', DashboardView.as_view()),
    path('api/reports/', include('reports.urls')),
>>>>>>> aab4ff3556ce39128544e4a5d5d813a3dc80987e
]