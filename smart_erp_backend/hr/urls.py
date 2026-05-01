from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, PayrollRunViewSet, SalarySlipViewSet

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'payroll', PayrollRunViewSet, basename='payroll')
router.register(r'salary-slips', SalarySlipViewSet, basename='salary-slips')

urlpatterns = router.urls
