from django.contrib import admin
from .models import Attendance, PayrollRun, SalarySlip

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'status', 'check_in', 'check_out', 'late_minutes']
    list_filter  = ['status', 'date']
    search_fields = ['employee__name']

@admin.register(PayrollRun)
class PayrollRunAdmin(admin.ModelAdmin):
    list_display = ['month', 'year', 'status', 'total_net', 'created_at']
    list_filter  = ['status', 'year']

@admin.register(SalarySlip)
class SalarySlipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'payroll_run', 'base_salary', 'net_salary', 'is_paid']
    list_filter  = ['is_paid', 'payroll_run']
    search_fields = ['employee__name']
