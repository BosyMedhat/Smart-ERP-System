from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
# استيراد كل الموديلات والسيرياليزر (تأكدي من وجود Employee في الموديلات)
from .models import (
    Product, Invoice, WorkShift, Installment, 
    Supplier, Purchase, Expense, Treasury, StockMovement, Customer,
    Employee  # تم إضافة الموظفين
)
from .serializers import (
    ProductSerializer, InvoiceSerializer, WorkShiftSerializer, InstallmentSerializer,
    SupplierSerializer, PurchaseSerializer, ExpenseSerializer, TreasurySerializer, 
    StockMovementSerializer, CustomerSerializer,
    EmployeeSerializer # تم إضافة السيرياليزر للموظفين
)

# 1. المنتجات
class ProductViewSet(viewsets.ModelViewSet): 
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# 2. الفواتير (نظام البيع وخصم المخزن)
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        items = data.get('items', [])
        shift_id = data.get('shift')
        total_amount = data.get('total')
        invoice_num = data.get('invoice_number')

        try:
            with transaction.atomic():
                shift = WorkShift.objects.get(id=shift_id)
                
                invoice = Invoice.objects.create(
                    invoice_number=invoice_num,
                    customer_id=data.get('customer'),
                    shift=shift,
                    total=total_amount,
                    payment_type=data.get('payment_type', 'CASH')
                )

                for item in items:
                    product = Product.objects.get(id=item['product_id'])
                    qty = int(item['quantity'])
                    if product.current_stock >= qty:
                        product.current_stock -= qty
                        product.save()
                    else:
                        raise Exception(f"الكمية غير كافية للمنتج: {product.name}")

                Treasury.objects.create(
                    transaction_type='دخل',
                    amount=total_amount,
                    reason=f"مبيعات فاتورة رقم: {invoice_num}"
                )

                return Response({"message": "تمت العملية بنجاح"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 3. الموظفين (الجديد لربط شاشة EmployeeExpenseManagement.tsx)
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

# 4. المصاريف (معدلة لتخصم من الخزينة تلقائياً)
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    def perform_create(self, serializer):
        # حفظ المصروف
        expense = serializer.save()
        # خصم المبلغ من الخزينة فوراً
        Treasury.objects.create(
            transaction_type='خرج',
            amount=expense.amount,
            reason=f"مصروف عام: {expense.title}"
        )

# 5. العملاء
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

# 6. الخزينة
class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer

# 7. الورديات
class WorkShiftViewSet(viewsets.ModelViewSet):
    queryset = WorkShift.objects.all()
    serializer_class = WorkShiftSerializer

# 8. الأقساط
class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer

# 9. الموردين
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

# 10. المشتريات
class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer

# 11. حركات المخزن
class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer