from rest_framework import serializers
from .models import (
    Product, Invoice, WorkShift, Installment, 
    Supplier, Purchase, Expense, Treasury, 
    StockMovement, Customer, Employee
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

# 4. العملاء
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
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