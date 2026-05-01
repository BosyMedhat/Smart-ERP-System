from rest_framework import serializers
from .models import (
    Product, Invoice, WorkShift, Installment, 
    Supplier, Purchase, Expense, Treasury, 
    StockMovement, Employee, Sale, SaleItem
)

# 1. الموظفين
class EmployeeSerializer(serializers.ModelSerializer):
    netSalary = serializers.ReadOnlyField() # الحقل المحسوب
    username = serializers.CharField(
        source='user.username',
        read_only=True,
        default=''
    )

    class Meta:
        model = Employee
        fields = ['id', 'name', 'position', 'baseSalary', 'advances', 'incentives', 'netSalary', 'attendance', 'username']

class InstallmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    invoice_number = serializers.CharField(source='sale.invoice_number', read_only=True)
    sale_final_amount = serializers.DecimalField(source='sale.final_amount', max_digits=12, decimal_places=2, read_only=True)
    monthly_amount = serializers.SerializerMethodField()

    def get_customer_name(self, obj):
        if obj.sale and obj.sale.customer:
            return obj.sale.customer.name
        return 'عميل نقدي'

    def get_monthly_amount(self, obj):
        if obj.months_count and obj.months_count > 0:
            return round(float(obj.amount) / obj.months_count, 2)
        return float(obj.amount)

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
    purchase_count = serializers.SerializerMethodField()
    total_purchases = serializers.SerializerMethodField()

    def get_purchase_count(self, obj):
        return obj.purchases.count()

    def get_total_purchases(self, obj):
        from django.db.models import Sum
        result = obj.purchases.aggregate(total=Sum('total_amount'))
        return result['total'] or 0

    class Meta:
        model = Supplier
        fields = '__all__'

# 8. المشتريات
class PurchaseSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

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