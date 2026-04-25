from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, F as models_F
# استيراد كل الموديلات والسيرياليزر (تأكدي من وجود Employee في الموديلات)
from .models import (
    Product, Invoice, WorkShift, Installment, 
    Supplier, Purchase, Expense, Treasury, StockMovement,
    Employee,  # تم إضافة الموظفين
    StoreSettings,  # إعدادات المتجر
    Sale, SaleItem  # فواتير المبيعات الجديدة
)
from .serializers import (
    ProductSerializer, InvoiceSerializer, WorkShiftSerializer, InstallmentSerializer,
    SupplierSerializer, PurchaseSerializer, ExpenseSerializer, TreasurySerializer, 
    StockMovementSerializer,
    EmployeeSerializer, # تم إضافة السيرياليزر للموظفين
    SaleItemSerializer, SaleSerializer, SaleItemWriteSerializer, SaleWriteSerializer
)
from .permissions import (
    CanManageProducts,
    CanManageInvoices,
    CanManageEmployees,
    CanManageSuppliers,
    CanViewReports,
    CanManageTreasury,
    CanManageUsers,
    IsManagerOrHasPermission,
    IsManager,
)

# 1. المنتجات
class ProductViewSet(viewsets.ModelViewSet): 
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [CanManageProducts]

# 2. الفواتير (نظام البيع وخصم المخزن)
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [CanManageInvoices]

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
    permission_classes = [CanManageEmployees]

# 4. المصاريف (معدلة لتخصم من الخزينة تلقائياً)
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsManager]

    def perform_create(self, serializer):
        # حفظ المصروف
        expense = serializer.save()
        # خصم المبلغ من الخزينة فوراً
        Treasury.objects.create(
            transaction_type='خرج',
            amount=expense.amount,
            reason=f"مصروف عام: {expense.title}"
        )

# 5. الخزينة
class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer
    permission_classes = [CanManageTreasury]

# 6. الورديات
class WorkShiftViewSet(viewsets.ModelViewSet):
    queryset = WorkShift.objects.all()
    serializer_class = WorkShiftSerializer
    permission_classes = [IsManagerOrHasPermission]

# 8. الأقساط
class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer
    permission_classes = [IsManagerOrHasPermission]

# 9. الموردين
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [CanManageSuppliers]

# 10. المشتريات
class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [CanManageSuppliers]

# 11. حركات المخزن
class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [CanManageProducts]

# 12. إعدادات المتجر
class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = '__all__'
class StoreSettingsViewSet(viewsets.ModelViewSet):
    queryset = StoreSettings.objects.all()
    serializer_class = StoreSettingsSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        obj, _ = StoreSettings.objects.get_or_create(pk=1)
        return obj


# ==================== SALE MODULE (NEW) ====================
# 13. فواتير المبيعات (POS Sales)
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().prefetch_related('items__product')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import SaleWriteSerializer
            return SaleWriteSerializer
        from .serializers import SaleSerializer
        return SaleSerializer

    def perform_create(self, serializer):
        """حساب الضريبة والمبلغ النهائي من StoreSettings"""
        # جلب إعدادات المتجر للحصول على نسبة الضريبة
        from .models import StoreSettings
        settings = StoreSettings.objects.first()
        tax_rate = settings.tax_rate if settings else 14.00  # 14% افتراضي

        total = serializer.validated_data.get('total_amount', 0)
        discount = serializer.validated_data.get('discount', 0)

        after_discount = float(total) - float(discount)
        tax_amount = after_discount * (float(tax_rate) / 100)
        final_amount = after_discount + tax_amount

        # تمرير القيم للـ serializer عبر context
        serializer.save(
            cashier=self.request.user,
            tax_amount=tax_amount,
            final_amount=final_amount
        )


# ==================== DASHBOARD API ====================
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)

        # مبيعات اليوم
        today_sales = Sale.objects.filter(
            created_at__date=today
        )
        total_sales_today = today_sales.aggregate(
            total=Sum('final_amount')
        )['total'] or 0

        # عدد العمليات اليوم
        operations_count = today_sales.count()

        # إجمالي التحصيلات (كاش فقط)
        total_cash = today_sales.filter(
            payment_type='cash'
        ).aggregate(
            total=Sum('final_amount')
        )['total'] or 0

        # تنبيهات المخزون المنخفض
        low_stock_alerts = Product.objects.filter(
            current_stock__lte=models_F('min_stock_level')
        ).count()

        # مبيعات آخر 7 أيام للـ chart
        sales_chart = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_total = Sale.objects.filter(
                created_at__date=day
            ).aggregate(
                total=Sum('final_amount')
            )['total'] or 0
            sales_chart.append({
                'date': day.strftime('%d/%m'),
                'total': float(day_total)
            })

        # آخر 10 أنشطة
        recent_sales = Sale.objects.select_related(
            'customer', 'cashier'
        ).order_by('-created_at')[:10]

        recent_activities = []
        for sale in recent_sales:
            recent_activities.append({
                'type': 'sale',
                'description': f"فاتورة {sale.invoice_number}",
                'amount': float(sale.final_amount),
                'payment': sale.payment_type,
                'customer': sale.customer.name if sale.customer else 'عميل نقدي',
                'cashier': sale.cashier.username if sale.cashier else '',
                'time': sale.created_at.strftime('%H:%M'),
                'date': sale.created_at.strftime('%d/%m/%Y'),
            })

        return Response({
            'total_sales_today': float(total_sales_today),
            'total_cash_today': float(total_cash),
            'operations_count': operations_count,
            'low_stock_alerts': low_stock_alerts,
            'sales_chart': sales_chart,
            'recent_activities': recent_activities,
        })