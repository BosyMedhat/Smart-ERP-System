from rest_framework import serializers
from .models import SystemAnomaly

class SystemAnomalySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemAnomaly
        fields = [
            'id', 'employee', 'employee_name', 'operation_type', 
            'old_value', 'new_value', 'reason', 'severity', 'timestamp'
        ]

    def get_employee_name(self, obj):
        if obj.employee:
            return obj.employee.username
        return obj.employee_name or "System"
