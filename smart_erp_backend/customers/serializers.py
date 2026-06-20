from decimal import Decimal

from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    # DASH-DEBTORS-001: annotated by debtors endpoint for real total debt
    installment_debt = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, default=Decimal('0')
    )
    total_debt = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, default=Decimal('0')
    )

    class Meta:
        model = Customer
        fields = '__all__'