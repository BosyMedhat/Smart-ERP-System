from rest_framework import serializers
from .models import (
    Product, Invoice, WorkShift, Installment, 
    Supplier, Purchase, Expense, Treasury, 
    StockMovement, Employee, Sale, SaleItem
)

# 1. الموظفين
class EmployeeSerializer(serializers.ModelSerializer):
    netSalary = serializers.ReadOnlyField() # الحقل المحسوب

    class Meta:
        model = Employee
        fields = ['id', 'name', 'position', 'baseSalary', 'advances', 'incentives', 'netSalary', 'attendance']

# 2. الأقساط (معدل لربط بيانات العميل والفاتورة)
class InstallmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='invoice.customer.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = Installment
        fields = '__all__'

# 3. المنتجات
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

# 5. الفواتير
class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

# 6. الورديات
class WorkShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkShift
        fields = '__all__'

# 7. الموردين
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

# 8. المشتريات
class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'

# 9. المصاريف
class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

# 10. الخزينة
class TreasurySerializer(serializers.ModelSerializer):
    class Meta:
        model = Treasury
        fields = '__all__'

# 11. حركات المخزن
class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = '__all__'

# 12. فواتير المبيعات (Sale Module)
class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'sale', 'product', 'product_name', 'quantity', 'unit_price', 'subtotal']
        read_only_fields = ['subtotal']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'cashier', 'cashier_name', 'total_amount', 'discount', 'tax_amount',
            'final_amount', 'payment_type', 'notes', 'created_at', 'items'
        ]
        read_only_fields = ['invoice_number', 'cashier', 'tax_amount', 'final_amount']

class SaleItemWriteSerializer(serializers.ModelSerializer):
    """Serializer للكتابة (إنشاء) SaleItem"""
    product_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = SaleItem
        fields = ['product', 'product_name', 'quantity', 'unit_price']

class SaleWriteSerializer(serializers.ModelSerializer):
    """Serializer للكتابة (إنشاء) Sale مع nested items"""
    items = SaleItemWriteSerializer(many=True)

    class Meta:
        model = Sale
        fields = ['customer', 'total_amount', 'discount', 'payment_type', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # extras تُمرر من perform_create
        cashier = validated_data.pop('cashier', None)
        tax_amount = validated_data.pop('tax_amount', 0)
        final_amount = validated_data.pop('final_amount', 0)
        
        sale = Sale.objects.create(
            **validated_data,
            cashier=cashier,
            tax_amount=tax_amount,
            final_amount=final_amount
        )
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        return sale