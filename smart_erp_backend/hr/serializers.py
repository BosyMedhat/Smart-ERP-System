from rest_framework import serializers
from .models import Attendance, PayrollRun, SalarySlip
from inventory.models import Employee


class EmployeeLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'name', 'position', 'baseSalary']


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.name', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name',
            'date', 'status', 'status_display',
            'check_in', 'check_out', 'late_minutes',
            'notes', 'recorded_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SalarySlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.name', read_only=True)

    class Meta:
        model = SalarySlip
        fields = [
            'id', 'employee', 'employee_name',
            'base_salary', 'incentives', 'advances',
            'deductions', 'absent_days', 'late_deduction',
            'net_salary', 'notes', 'is_paid', 'paid_at',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PayrollRunSerializer(serializers.ModelSerializer):
    slips = SalarySlipSerializer(many=True, read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.username', read_only=True)

    class Meta:
        model = PayrollRun
        fields = [
            'id', 'month', 'year', 'status', 'status_display',
            'total_gross', 'total_deductions', 'total_net',
            'notes', 'created_by', 'created_by_name',
            'approved_by', 'paid_at', 'created_at', 'slips'
        ]
        read_only_fields = ['id', 'created_at', 'total_gross',
                            'total_deductions', 'total_net']
