from rest_framework import viewsets, status, serializers, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, F as models_F, Q as models_Q
from customers.models import Customer
# استيراد كل الموديلات والسيرياليزر (تأكدي من وجود Employee في الموديلات)
from .models import (
    Product, Invoice, WorkShift, Installment,
    Supplier, Purchase, Expense, Treasury, StockMovement,
    Employee,  # تم إضافة الموظفين
    StoreSettings,  # إعدادات المتجر
    Sale, SaleItem,  # فواتير المبيعات الجديدة
    SupplierEvaluation, SupplierProductRanking
)
from .serializers import (
    ProductSerializer, InvoiceSerializer, WorkShiftSerializer, InstallmentSerializer,
    SupplierSerializer, PurchaseSerializer, ExpenseSerializer, TreasurySerializer, 
    StockMovementSerializer,
    EmployeeSerializer, # تم إضافة السيرياليزر للموظفين
    SaleItemSerializer, SaleSerializer, SaleItemWriteSerializer, SaleWriteSerializer,
    SupplierEvaluationSerializer, SupplierProductRankingSerializer
)
from .permissions import (
    CanManageProducts,
    CanManageInvoices,
    CanManageEmployees,
    CanManageSuppliers,
    CanAccessSuppliers,
    CanViewReports,
    CanManageTreasury,
    CanManageUsers,
    IsManagerOrHasPermission,
    IsManager,
    CanMakeSales,
    CanViewDashboard,
    IsManagerRole,
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
        except WorkShift.DoesNotExist:
            # ERP-P1-013: Specific error handling for missing shift
            return Response(
                {
                    "error": "لا يوجد شيفت صالح لهذه الفاتورة. افتح شيفت أولاً أو استخدم مسار البيع الحالي /api/sales/."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
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

    @action(detail=False, methods=['post'])
    def open(self, request):
        """
        Open a new shift for the current user.
        POST /api/shifts/open/
        Request body: {"starting_cash": 2000, "notes": "optional"}
        Prevents opening if user already has an open shift.
        """
        try:
            # Check if user already has an open shift
            existing_open = WorkShift.objects.filter(
                user=request.user,
                status='open'
            ).first()

            if existing_open:
                return Response(
                    {
                        'error': 'توجد وردية مفتوحة بالفعل',
                        'detail': 'يجب إغلاق الوردية الحالية قبل فتح وردية جديدة',
                        'existing_shift': {
                            'id': existing_open.id,
                            'shift_date': existing_open.shift_date,
                            'start_time': existing_open.start_time,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate starting_cash
            starting_cash = request.data.get('starting_cash')
            if starting_cash is None:
                return Response(
                    {'error': 'رصيد أول الوردية مطلوب', 'detail': 'يرجى إدخال المبلغ الافتتاحي'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                starting_cash = Decimal(str(starting_cash))
                if starting_cash < 0:
                    raise ValueError('المبلغ لا يمكن أن يكون سالباً')
            except (ValueError, TypeError):
                return Response(
                    {'error': 'المبلغ غير صالح', 'detail': 'رصيد أول الوردية يجب أن يكون رقماً موجباً'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get optional notes
            notes = request.data.get('notes', '')

            # Create new shift
            from django.utils import timezone
            shift = WorkShift.objects.create(
                user=request.user,
                shift_date=timezone.now().date(),
                starting_cash=starting_cash,
                expected_cash=starting_cash,  # Initially same as starting
                total_sales=Decimal('0'),
                status='open',
                notes=notes
            )

            serializer = self.get_serializer(shift)
            return Response({
                'message': 'تم فتح الوردية بنجاح',
                'shift': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': 'حدث خطأ أثناء فتح الوردية', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Close a shift with actual cash amount.
        POST /api/shifts/{id}/close/
        Request body: {"actual_cash": 1000, "notes": "optional"}
        """
        try:
            shift = self.get_object()

            # Validate shift is not already closed
            if shift.status == 'closed':
                return Response(
                    {'error': 'الوردية مغلقة بالفعل', 'detail': 'لا يمكن إغلاق الوردية مرتين'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate actual_cash is provided
            actual_cash = request.data.get('actual_cash')
            if actual_cash is None:
                return Response(
                    {'error': 'المبلغ الفعلي مطلوب', 'detail': 'يرجى إدخال المبلغ الفعلي المستلم'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate actual_cash is numeric
            try:
                actual_cash = Decimal(str(actual_cash))
                if actual_cash < 0:
                    raise ValueError('المبلغ لا يمكن أن يكون سالباً')
            except (ValueError, TypeError):
                return Response(
                    {'error': 'المبلغ غير صالح', 'detail': 'المبلغ الفعلي يجب أن يكون رقماً موجباً'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get optional notes
            notes = request.data.get('notes', '')

            # Close the shift using model method
            shift.close_shift(actual_cash, notes)

            # Serialize and return updated shift
            serializer = self.get_serializer(shift)
            return Response({
                'message': 'تم إغلاق الوردية بنجاح',
                'shift': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': 'حدث خطأ أثناء إغلاق الوردية', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get the current open shift for the logged-in user.
        GET /api/shifts/current/
        Returns 404 if no open shift exists.
        """
        try:
            # Find open shift for current user
            shift = WorkShift.objects.filter(
                user=request.user,
                status='open'
            ).order_by('-start_time').first()

            if not shift:
                return Response(
                    {'message': 'لا توجد وردية مفتوحة', 'detail': 'يرجى فتح وردية جديدة'},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = self.get_serializer(shift)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': 'حدث خطأ أثناء جلب بيانات الوردية', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all().select_related('sale__customer')
    serializer_class = InstallmentSerializer
    permission_classes = [IsManagerOrHasPermission]

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        from django.db import transaction as db_transaction
        from decimal import Decimal
        from treasury.models import TreasuryAccount, TreasuryTransaction

        installment = self.get_object()
        amount = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'error': 'المبلغ يجب أن يكون أكبر من صفر'}, status=400)

        actual_paid = min(amount, float(installment.remaining_amount))
        new_remaining = max(0, float(installment.remaining_amount) - amount)

        with db_transaction.atomic():
            installment.remaining_amount = new_remaining
            installment.is_paid = new_remaining <= 0
            installment.save()

            # ISS-07 FIX: record installment collection in Treasury Ledger
            if actual_paid > 0:
                acc, _ = TreasuryAccount.objects.get_or_create(
                    name='CASH',
                    defaults={'display_name': 'CASH', 'balance': Decimal('0')}
                )
                acc_locked = TreasuryAccount.objects.select_for_update().get(pk=acc.pk)
                acc_locked.balance += Decimal(str(actual_paid))
                acc_locked.save()
                invoice_num = installment.sale.invoice_number if installment.sale else str(installment.pk)
                TreasuryTransaction.objects.create(
                    account=acc_locked,
                    transaction_type='INCOME',
                    category='INSTALLMENT',
                    amount=Decimal(str(actual_paid)),
                    balance_after=acc_locked.balance,
                    description=f'تحصيل قسط — فاتورة {invoice_num}',
                    reference_type='installment',
                    reference_id=installment.pk,
                    created_by=request.user,
                    is_auto=True,
                )

        return Response({
            'success': True,
            'remaining_amount': installment.remaining_amount,
            'is_paid': installment.is_paid
        })

    @action(detail=True, methods=['get'], url_path='payment-history')
    def payment_history(self, request, pk=None):
        """
        GET /api/installments/{id}/payment-history/
        Returns complete payment history for an installment using TreasuryTransaction records.
        """
        from decimal import Decimal
        from treasury.models import TreasuryTransaction

        installment = self.get_object()

        # Query TreasuryTransaction for all payments related to this installment
        payments_qs = TreasuryTransaction.objects.filter(
            reference_type='installment',
            reference_id=installment.pk
        ).order_by('created_at')

        # Build payments list
        payments = []
        total_paid = Decimal('0')

        for txn in payments_qs:
            payment_amount = Decimal(str(txn.amount))
            total_paid += payment_amount

            payments.append({
                'id': txn.id,
                'amount': str(payment_amount),
                'paid_at': txn.created_at.isoformat(),
                'recorded_by': txn.created_by.username if txn.created_by else None,
                'recorded_by_name': txn.created_by.get_full_name() if txn.created_by else None,
                'description': txn.description,
                'transaction_type': txn.transaction_type,
            })

        # Calculate summary
        original_amount = Decimal(str(installment.amount))
        down_payment = Decimal(str(installment.down_payment))
        current_remaining = Decimal(str(installment.remaining_amount))

        # Customer info
        customer_name = None
        if installment.sale and installment.sale.customer:
            customer_name = installment.sale.customer.name

        # Invoice number
        invoice_number = None
        if installment.sale:
            invoice_number = installment.sale.invoice_number

        return Response({
            'installment_id': installment.id,
            'invoice_number': invoice_number,
            'customer_name': customer_name,
            'total_amount': str(original_amount + down_payment),  # Full invoice amount
            'installment_amount': str(original_amount),
            'down_payment': str(down_payment),
            'current_remaining': str(current_remaining),
            'is_paid': installment.is_paid,
            'payments': payments,
            'payment_summary': {
                'total_paid': str(total_paid),
                'remaining': str(current_remaining),
                'payments_count': len(payments),
            }
        })

# 9. الموردين
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, CanAccessSuppliers]

    @action(detail=True, methods=['post'])
    def pay_debt(self, request, pk=None):
        from django.db import transaction as db_transaction
        from treasury.models import TreasuryAccount, TreasuryTransaction

        supplier = self.get_object()
        amount = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'error': 'المبلغ يجب أن يكون أكبر من صفر'}, status=400)

        with db_transaction.atomic():
            supplier_locked = Supplier.objects.select_for_update().get(pk=supplier.pk)
            actual_payment = min(amount, float(supplier_locked.balance))
            new_balance = max(0, float(supplier_locked.balance) - actual_payment)
            supplier_locked.balance = new_balance
            supplier_locked.save()

            # Financial Integrity: record supplier payment in Treasury Ledger
            if actual_payment > 0:
                acc, _ = TreasuryAccount.objects.get_or_create(
                    name='CASH',
                    defaults={
                        'display_name': 'الخزينة النقدية',
                        'balance': Decimal('0')
                    }
                )
                acc_locked = TreasuryAccount.objects.select_for_update().get(pk=acc.pk)
                acc_locked.balance -= Decimal(str(actual_payment))
                acc_locked.save()

                TreasuryTransaction.objects.create(
                    account=acc_locked,
                    transaction_type='EXPENSE',
                    category='PURCHASE',
                    amount=Decimal(str(actual_payment)),
                    balance_after=acc_locked.balance,
                    description=f'سداد دين مورد: {supplier.name}',
                    reference_type='supplier_payment',
                    reference_id=supplier.pk,
                    created_by=request.user,
                    is_auto=True,
                )

        return Response({
            'success': True,
            'balance': supplier_locked.balance,
            'paid_amount': actual_payment,
        })

    @action(detail=True, methods=['get'], url_path='evaluations')
    def evaluations(self, request, pk=None):
        supplier = self.get_object()
        evals = supplier.evaluations.select_related(
            'evaluated_by'
        ).order_by('-created_at')
        serializer = SupplierEvaluationSerializer(evals, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='insights')
    def insights(self, request, pk=None):
        from .services import SupplierIntelligenceService
        supplier = self.get_object()
        data = SupplierIntelligenceService.enrich_supplier(supplier)
        data['supplier_id'] = supplier.id
        data['supplier_name'] = supplier.name
        return Response(data)

    @action(detail=False, methods=['get'], url_path='recommendations')
    def recommendations(self, request):
        from .services import SupplierIntelligenceService
        top = SupplierIntelligenceService.get_top_suppliers()
        return Response({
            'top_suppliers': top,
            'all_rankings': SupplierIntelligenceService.calculate_recommendations(),
        })

# 10. المشتريات
class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, CanAccessSuppliers]

# 9.5. تقييمات الموردين
class SupplierEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierEvaluationSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, CanAccessSuppliers]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        supplier_id = self.request.query_params.get('supplier')
        qs = SupplierEvaluation.objects.select_related(
            'supplier', 'evaluated_by'
        )
        if supplier_id:
            qs = qs.filter(supplier_id=supplier_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(evaluated_by=self.request.user)


# 9.6. ترتيب الموردين لكل منتج (Future: Best Supplier Per Product)
class SupplierProductRankingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for future Best Supplier Per Product rankings.
    Current release: structure is ready; data is populated only if present.
    """
    queryset = SupplierProductRanking.objects.select_related(
        'product', 'supplier'
    ).order_by('product', 'rank')
    serializer_class = SupplierProductRankingSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, CanAccessSuppliers]

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

# 11. حركات المخزن
class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [CanManageProducts]

# 12. إعدادات المتجر
class StoreSettingsSerializer(serializers.ModelSerializer):
    store_logo = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = StoreSettings
        fields = '__all__'

class StoreSettingsViewSet(viewsets.ModelViewSet):
    queryset = StoreSettings.objects.all()
    serializer_class = StoreSettingsSerializer
    permission_classes = [IsAuthenticated, IsManagerRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        obj, _ = StoreSettings.objects.get_or_create(pk=1)
        return obj


# ==================== DYNAMIC PRICING CONFIG ====================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pricing_config(request):
    """
    Returns dynamic pricing config for frontend Cart.
    GET /api/pricing-config/
    """
    settings = StoreSettings.objects.first()
    return Response({
        'installment_markup_pct': str(
            settings.installment_markup_pct
            if settings else Decimal('0')
        ),
        'credit_markup_pct': str(
            settings.credit_markup_pct
            if settings else Decimal('0')
        ),
        'tax_rate': str(
            settings.tax_rate
            if settings else Decimal('14')
        ),
        'enable_tax': bool(settings.enable_tax) if settings else False,
    })


# ==================== SALE MODULE (NEW) ====================
# 13. فواتير المبيعات (POS Sales)
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().prefetch_related('items__product')

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), CanMakeSales()]
        return [IsAuthenticated(), CanViewDashboard()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            from .serializers import SaleWriteSerializer
            return SaleWriteSerializer
        from .serializers import SaleSerializer
        return SaleSerializer

    def perform_create(self, serializer):
        from django.db import transaction
        from django.core.exceptions import ValidationError
        from .models import StoreSettings, Installment
        from decimal import Decimal
        import datetime

        # Validate: installment and credit sales require a customer
        payment_type = serializer.validated_data.get('payment_type', 'cash')
        customer = serializer.validated_data.get('customer')
        if payment_type in ['installment', 'credit'] and not customer:
            raise serializers.ValidationError({'customer': 'يجب اختيار عميل لفاتورة التقسيط أو الآجل'})

        # For cash payments: require walk_in_name and walk_in_phone, auto-create/find Customer
        if payment_type in ['cash', 'vodafone_cash', 'instapay', 'card']:
            walk_in_name = self.request.data.get('walk_in_name', '').strip()
            walk_in_phone = self.request.data.get('walk_in_phone', '').strip()

            if not walk_in_name:
                raise serializers.ValidationError({'walk_in_name': 'اسم العميل مطلوب'})
            if not walk_in_phone:
                raise serializers.ValidationError({'walk_in_phone': 'رقم الهاتف مطلوب'})
            if not walk_in_phone.isdigit() or not (10 <= len(walk_in_phone) <= 15):
                raise serializers.ValidationError({'walk_in_phone': 'رقم الهاتف غير صحيح'})

            # Find or create customer by phone (use filter to avoid MultipleObjectsReturned)
            customer = Customer.objects.filter(phone=walk_in_phone).first()
            if not customer:
                customer = Customer.objects.create(
                    phone=walk_in_phone,
                    name=walk_in_name
                )
            # Link customer to sale data
            serializer.validated_data['customer'] = customer

        with transaction.atomic():
            settings = StoreSettings.objects.first()
            # Respect enable_tax flag — only apply if explicitly enabled
            if settings and settings.enable_tax:
                tax_rate = Decimal(str(settings.tax_rate))
            else:
                tax_rate = Decimal('0.00')

            # Dynamic pricing markup based on payment type
            markup_pct = Decimal('0')
            if settings:
                if payment_type == 'installment':
                    markup_pct = Decimal(str(settings.installment_markup_pct))
                elif payment_type == 'credit':
                    markup_pct = Decimal(str(settings.credit_markup_pct))

            total = Decimal(str(
                serializer.validated_data.get('total_amount', 0)
            ))
            discount_type = serializer.validated_data.get('discount_type', 'percentage')
            discount_value = Decimal(str(
                serializer.validated_data.get('discount', 0)
            ))

            # Apply markup BEFORE discount and tax
            if markup_pct > Decimal('0'):
                markup_amount = total * (markup_pct / Decimal('100'))
                total = total + markup_amount

            # Calculate discount amount based on type
            if discount_type == 'percentage':
                # Validation: percentage must be between 0 and 100
                if discount_value < Decimal('0') or discount_value > Decimal('100'):
                    raise ValidationError(
                        {'discount': 'الخصم بالنسبة يجب أن يكون بين 0 و 100%'}
                    )
                discount_amount = total * (discount_value / Decimal('100'))
            elif discount_type == 'fixed':
                # Validation: fixed discount cannot exceed subtotal
                if discount_value < Decimal('0'):
                    raise ValidationError(
                        {'discount': 'قيمة الخصم لا يمكن أن تكون سالبة'}
                    )
                if discount_value > total:
                    raise ValidationError(
                        {'discount': 'قيمة الخصم لا يمكن أن تتجاوي الإجمالي'}
                    )
                discount_amount = discount_value
            else:  # legacy or any other value - treat as fixed for safety
                discount_amount = discount_value

            after_discount = total - discount_amount
            tax_amount = after_discount * (tax_rate / Decimal('100'))
            final_amount = after_discount + tax_amount

            sale = serializer.save(
                cashier=self.request.user,
                tax_amount=tax_amount,
                final_amount=final_amount
            )

            # Deduct stock for each sale item
            for item in sale.items.all():
                if item.product:
                    product = item.product
                    if product.current_stock >= item.quantity:
                        product.current_stock -= item.quantity
                        product.save()
                    else:
                        raise ValidationError(
                            f"المخزون غير كافٍ للمنتج: {product.name} "
                            f"(المطلوب: {item.quantity}, المتاح: {product.current_stock})"
                        )

            # If credit: add to customer balance
            if payment_type == 'credit' and sale.customer:
                sale.customer.balance += sale.final_amount
                sale.customer.save()

            # If installment: validate inputs then create installment record
            if payment_type == 'installment':
                from treasury.models import TreasuryAccount, TreasuryTransaction

                # ISS-02/03: Validate down_payment range
                try:
                    down_payment = Decimal(str(self.request.data.get('down_payment', 0)))
                except Exception:
                    raise serializers.ValidationError({'down_payment': 'قيمة المقدم غير صالحة'})

                if down_payment < Decimal('0'):
                    raise serializers.ValidationError(
                        {'down_payment': 'المقدم لا يمكن أن يكون سالباً'}
                    )
                if down_payment > final_amount:
                    raise serializers.ValidationError(
                        {'down_payment': f'المقدم ({down_payment}) لا يمكن أن يتجاوز إجمالي الفاتورة ({final_amount})'}
                    )

                # ISS-05: Validate months_count
                try:
                    months_count = int(self.request.data.get('months_count', 1))
                except (ValueError, TypeError):
                    raise serializers.ValidationError({'months_count': 'عدد الأشهر غير صالح'})

                if months_count < 1:
                    raise serializers.ValidationError(
                        {'months_count': 'عدد الأشهر يجب أن يكون 1 على الأقل'}
                    )

                due_date_str = self.request.data.get('due_date', None)
                due_date = datetime.date.fromisoformat(due_date_str) if due_date_str else datetime.date.today()

                installment_amount = final_amount - down_payment

                installment = Installment.objects.create(
                    sale=sale,
                    down_payment=down_payment,
                    months_count=months_count,
                    amount=installment_amount,
                    remaining_amount=installment_amount,
                    due_date=due_date,
                    is_paid=(installment_amount <= Decimal('0'))
                )

                # ISS-08 FIX: record down_payment in Treasury here (after Installment exists)
                # This replaces the signal logic which had a race condition
                if down_payment > Decimal('0'):
                    acc, _ = TreasuryAccount.objects.get_or_create(
                        name='CASH',
                        defaults={'display_name': 'CASH', 'balance': Decimal('0')}
                    )
                    acc_locked = TreasuryAccount.objects.select_for_update().get(pk=acc.pk)
                    acc_locked.balance += down_payment
                    acc_locked.save()
                    TreasuryTransaction.objects.create(
                        account=acc_locked,
                        transaction_type='INCOME',
                        category='INSTALLMENT',
                        amount=down_payment,
                        balance_after=acc_locked.balance,
                        description=f'دفعة أولى — فاتورة {sale.invoice_number}',
                        reference_type='sale',
                        reference_id=sale.pk,
                        created_by=self.request.user,
                        is_auto=True,
                    )


# ==================== BARCODE LOOKUP API ====================
class ProductByBarcodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, barcode):
        try:
            product = Product.objects.get(barcode=barcode)
            serializer = ProductSerializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {'error': f'لم يتم العثور على منتج بالباركود: {barcode}'},
                status=404
            )


# ==================== DASHBOARD API ====================
class DashboardView(APIView):
    permission_classes = [IsAuthenticated, CanViewDashboard]

    def get(self, request):
        today = timezone.now().date()

        # مبيعات اليوم
        today_sales = Sale.objects.filter(
            created_at__date=today
        )
        total_sales_today = today_sales.aggregate(
            total=Sum('final_amount')
        )['total'] or 0

        # عدد العمليات اليوم
        operations_count = today_sales.count()

        # BUG-01 FIX: التحصيلات الفورية = كاش + فودافون + إنستاباي + كارت
        # يتطابق مع تعريف cash_revenue في Sales/Financial Reports
        payment_breakdown = today_sales.aggregate(
            cash=Sum('final_amount', filter=models_Q(payment_type='cash')),
            vodafone=Sum('final_amount', filter=models_Q(payment_type='vodafone_cash')),
            instapay=Sum('final_amount', filter=models_Q(payment_type='instapay')),
            card=Sum('final_amount', filter=models_Q(payment_type='card')),
        )
        total_cash = (
            (payment_breakdown['cash'] or 0) +
            (payment_breakdown['vodafone'] or 0) +
            (payment_breakdown['instapay'] or 0) +
            (payment_breakdown['card'] or 0)
        )

        # BUG-05 FIX: الفصل بين المخزون المنخفض والمخزون المنعدم
        # out_of_stock: current_stock <= 0
        out_of_stock_count = Product.objects.filter(
            current_stock__lte=0
        ).count()
        # low_stock: أقل من الحد الأدنى لكن لم ينعدم بعد
        low_stock_count = Product.objects.filter(
            current_stock__gt=0,
            current_stock__lte=models_F('min_stock_level')
        ).count()

        # مبيعات الشهر الحالي (ERP-DASH-001B)
        first_day_of_month = today.replace(day=1)
        month_sales = Sale.objects.filter(created_at__date__gte=first_day_of_month)
        total_sales_month = month_sales.aggregate(
            total=Sum('final_amount')
        )['total'] or 0
        operations_count_month = month_sales.count()

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

        # BUG-02 FIX: آخر 10 أنشطة اليوم فقط
        recent_sales = Sale.objects.select_related(
            'customer', 'cashier'
        ).filter(
            created_at__date=today
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
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'sales_chart': sales_chart,
            'recent_activities': recent_activities,
            # ERP-DASH-001B: Monthly metrics
            'total_sales_month': float(total_sales_month),
            'operations_count_month': operations_count_month,
        })


# ==================== SMART ALERTS API ====================
class AlertsView(APIView):
    """
    GET /api/alerts/
    يرجع كل التنبيهات الذكية للنظام
    """
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        alerts = []

        # ── 1. منتجات منخفضة المخزون ─────────────────
        try:
            low_stock_products = Product.objects.filter(
                current_stock__lte=models_F('min_stock_level'),
                current_stock__gt=0,
            ).values('id', 'name', 'current_stock', 'min_stock_level')[:10]

            out_of_stock = Product.objects.filter(
                current_stock__lte=0
            ).values('id', 'name')[:10]

            if out_of_stock.exists():
                alerts.append({
                    'type':     'out_of_stock',
                    'severity': 'critical',
                    'title':    'منتجات نفدت من المخزون',
                    'message':  f'{out_of_stock.count()} منتج نفد من المخزون',
                    'count':    out_of_stock.count(),
                    'data':     list(out_of_stock),
                })

            if low_stock_products.exists():
                alerts.append({
                    'type':     'low_stock',
                    'severity': 'warning',
                    'title':    'مخزون منخفض',
                    'message':  f'{low_stock_products.count()} منتج يحتاج تجديد',
                    'count':    low_stock_products.count(),
                    'data':     list(low_stock_products),
                })
        except Exception:
            pass

        # ── 2. أقساط متأخرة ──────────────────────────
        try:
            from .models import Installment
            today = timezone.now().date()

            overdue = Installment.objects.filter(
                is_paid=False,
                due_date__lt=today,
                remaining_amount__gt=0,
            ).select_related('sale__customer')[:10]

            due_today = Installment.objects.filter(
                is_paid=False,
                due_date=today,
                remaining_amount__gt=0,
            ).select_related('sale__customer')[:10]

            if overdue.exists():
                overdue_data = []
                for inst in overdue:
                    customer_name = ''
                    if inst.sale and inst.sale.customer:
                        customer_name = inst.sale.customer.name
                    overdue_data.append({
                        'id':            inst.pk,
                        'customer':      customer_name,
                        'remaining':     str(inst.remaining_amount),
                        'due_date':      str(inst.due_date),
                        'days_overdue':  (today - inst.due_date).days,
                    })
                alerts.append({
                    'type':     'overdue_installment',
                    'severity': 'critical',
                    'title':    'أقساط متأخرة',
                    'message':  f'{len(overdue_data)} قسط متأخر عن موعده',
                    'count':    len(overdue_data),
                    'data':     overdue_data,
                })

            if due_today.exists():
                due_data = []
                for inst in due_today:
                    customer_name = ''
                    if inst.sale and inst.sale.customer:
                        customer_name = inst.sale.customer.name
                    due_data.append({
                        'id':        inst.pk,
                        'customer':  customer_name,
                        'remaining': str(inst.remaining_amount),
                    })
                alerts.append({
                    'type':     'due_today_installment',
                    'severity': 'warning',
                    'title':    'أقساط مستحقة اليوم',
                    'message':  f'{len(due_data)} قسط مستحق اليوم',
                    'count':    len(due_data),
                    'data':     due_data,
                })
        except Exception:
            pass

        # ── 3. رصيد خزينة منخفض ──────────────────────
        try:
            from treasury.models import TreasuryAccount
            from .models import StoreSettings

            settings = StoreSettings.objects.first()
            threshold = Decimal('500')
            if settings and hasattr(settings, 'treasury_alert_threshold'):
                threshold = settings.treasury_alert_threshold

            low_accounts = TreasuryAccount.objects.filter(
                is_active=True,
                balance__lt=threshold,
                balance__gte=0,
            ).values('id', 'display_name', 'balance')

            if low_accounts.exists():
                alerts.append({
                    'type':     'low_treasury',
                    'severity': 'warning',
                    'title':    'رصيد خزينة منخفض',
                    'message':  f'{low_accounts.count()} حساب رصيده منخفض عن {threshold} ج.م',
                    'count':    low_accounts.count(),
                    'data':     list(low_accounts),
                })

            negative_accounts = TreasuryAccount.objects.filter(
                is_active=True,
                balance__lt=0,
            ).values('id', 'display_name', 'balance')

            if negative_accounts.exists():
                alerts.append({
                    'type':     'negative_treasury',
                    'severity': 'critical',
                    'title':    'رصيد خزينة سالب',
                    'message':  f'{negative_accounts.count()} حساب رصيده سالب',
                    'count':    negative_accounts.count(),
                    'data':     list(negative_accounts),
                })
        except Exception:
            pass

        # ── ترتيب: critical أولاً ─────────────────────
        severity_order = {'critical': 0, 'warning': 1, 'info': 2}
        alerts.sort(key=lambda x: severity_order.get(x['severity'], 3))

        return Response({
            'total':   len(alerts),
            'alerts':  alerts,
            'checked_at': timezone.now().isoformat(),
        })