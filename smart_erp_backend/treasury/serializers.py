from rest_framework import serializers
from .models import TreasuryAccount, TreasuryTransaction


class TreasuryAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TreasuryAccount
        fields = ['id', 'name', 'display_name', 'balance', 'is_active', 'created_at']
        read_only_fields = ['balance', 'created_at']


class TreasuryTransactionSerializer(serializers.ModelSerializer):
    account_name    = serializers.CharField(source='account.display_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )

    class Meta:
        model  = TreasuryTransaction
        fields = [
            'id', 'account', 'account_name',
            'transaction_type', 'transaction_type_display',
            'category', 'category_display',
            'amount', 'balance_after', 'description',
            'reference_type', 'reference_id',
            'created_by', 'created_by_name',
            'is_auto', 'created_at',
        ]
        read_only_fields = ['balance_after', 'is_auto', 'created_at', 'created_by']


class ManualTransactionSerializer(serializers.Serializer):
    """للإدخال اليدوي فقط — مصروفات عامة أو تسويات"""
    account_id       = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(choices=['INCOME', 'EXPENSE', 'ADJUSTMENT'])
    category         = serializers.ChoiceField(choices=[
        'SALE', 'PURCHASE', 'SALARY', 'INSTALLMENT',
        'RENT', 'ELECTRICITY', 'MAINTENANCE', 'MANUAL', 'OTHER'
    ])
    amount      = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    description = serializers.CharField(max_length=500)
