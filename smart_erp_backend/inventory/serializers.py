from rest_framework import serializers
from .models import (
    Product, Invoice, WorkShift, Installment, 
    Supplier, Purchase, Expense, Treasury, 
    StockMovement, Customer, Employee, SalesRepresentative
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
    status = serializers.SerializerMethodField()
    supplier_name = serializers.ReadOnlyField(source='supplier.name')

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'unit', 'cost_price', 'retail_price', 
            'wholesale_price', 'current_stock', 'min_stock_level', 
            'expiry_date', 'image', 'category', 'status', 'supplier_name'
        ]

    def get_status(self, obj):
        return "متوفر" if obj.current_stock > 0 else "نفذت الكمية"

# 4. العملاء
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

# 5. الفواتير
class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')
    representative_name = serializers.ReadOnlyField(source='representative.name')

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 
            'representative', 'representative_name', 'shift', 
            'total', 'tax_amount', 'discount_amount', 
            'payment_type', 'created_at'
        ]

# 6. الورديات
class WorkShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkShift
        fields = '__all__'
        read_only_fields = ['user'] # منع المطالبة باليوزر في الطلب لأنه سيؤخذ من السيشن

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

class SalesRepresentativeSerializer(serializers.ModelSerializer):
    total_sales = serializers.SerializerMethodField()
    commission = serializers.SerializerMethodField()

    class Meta:
        model = SalesRepresentative
        fields = [
            'id', 'name', 'phone', 'target_sales', 
            'commission_rate', 'total_sales', 'commission', 'is_active'
        ]

    def get_total_sales(self, obj):
        # Calculate sum of all invoices for this rep
        from django.db.models import Sum
        return obj.invoices.aggregate(Sum('total'))['total__sum'] or 0

    def get_commission(self, obj):
        total = self.get_total_sales(obj)
        return (total * float(obj.commission_rate)) / 100

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