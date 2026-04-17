from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from accounts.permissions import RoleBasedPermission
from django.db import transaction
from django.utils import timezone

from .models import (
    Product, Invoice, WorkShift, Installment,
    Supplier, Purchase, Expense, Treasury, StockMovement, Customer,
    Employee, SalesRepresentative,
)
from system_settings.models import SystemSettings
from .serializers import (
    ProductSerializer, InvoiceSerializer, WorkShiftSerializer, InstallmentSerializer,
    SupplierSerializer, PurchaseSerializer, ExpenseSerializer, TreasurySerializer,
    StockMovementSerializer, CustomerSerializer,
    EmployeeSerializer, SalesRepresentativeSerializer,
)
from django.db.models import Sum, F
from django.db.models.functions import TruncDay

# ── Helper: Treasury Balance Check ───────────────────────────────────────────
def get_treasury_balance():
    """Calculates the current net balance in the Treasury ledger."""
    incomes = Treasury.objects.filter(transaction_type='دخل').aggregate(models.Sum('amount'))['amount__sum'] or 0
    expenses = Treasury.objects.filter(transaction_type='خرج').aggregate(models.Sum('amount'))['amount__sum'] or 0
    return incomes - expenses


# ── 1. المنتجات ──────────────────────────────────────────────────────────────
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 1. Search (Search by name or SKU)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(models.Q(name__icontains=search) | models.Q(sku__icontains=search))
            
        # 2. Filter by Category
        category = self.request.query_params.get('category')
        if category and category != 'الكل':
            queryset = queryset.filter(category=category)
            
        # 3. Filter by Status
        status_param = self.request.query_params.get('status')
        if status_param == 'متوفر':
            queryset = queryset.filter(current_stock__gt=0)
        elif status_param == 'نفذت الكمية':
            queryset = queryset.filter(current_stock__lte=0)
            
        return queryset


# ── 2. الفواتير ───────────────────────────────────────────────────────────────
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def create(self, request, *args, **kwargs):
        data = request.data
        items = data.get('items', [])
        total_amount = data.get('total')
        payment_type = data.get('payment_type', 'CASH')
        
        # Calculate/Verify Tax from SystemSettings
        settings = SystemSettings.get_settings()
        total_val = float(total_amount)
        calculated_tax = total_val * (float(settings.vat_percentage) / 100)
        tax_amount = data.get('tax_amount', calculated_tax)
        invoice_num = f"INV-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        active_shift = WorkShift.objects.filter(user=request.user, end_time__isnull=True).first()
        if not active_shift:
            return Response({"error": "يجب فتح وردية (WorkShift) قبل البدء في عمليات البيع."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Create the Invoice record
                invoice = Invoice.objects.create(
                    invoice_number=invoice_num,
                    customer_id=data.get('customer'),
                    shift=active_shift,
                    total=total_amount,
                    tax_amount=tax_amount,
                    discount_amount=data.get('discount_amount', 0),
                    payment_type=payment_type,
                )

                # 2. Check Stock Availability and Update
                for item in items:
                    product = Product.objects.select_for_update().get(id=item['product_id'])
                    qty = float(item['quantity'])
                    
                    if not settings.allow_negative_stock and float(product.current_stock) < qty:
                        raise Exception(f"Insufficient stock for: {product.name}. Available: {product.current_stock}")
                    
                    # Update stock and log movement
                    product.current_stock -= qty
                    product.save()
                    
                    StockMovement.objects.create(
                        product=product,
                        type='SALE',
                        quantity=qty,
                        reason=f"Sale Invoice: {invoice_num}"
                    )

                # 3. Handle Payment Logic
                if payment_type == 'INSTALLMENT':
                    installments_count = int(data.get('installments_count', 1))
                    amount_per_installment = invoice.total / installments_count
                    for i in range(installments_count):
                        Installment.objects.create(
                            invoice=invoice,
                            due_date=timezone.now().date() + timezone.timedelta(days=30 * (i + 1)),
                            amount=amount_per_installment,
                            remaining_amount=amount_per_installment,
                            installments_count=installments_count
                        )
                
                elif payment_type == 'CREDIT':
                    # Update Customer Balance (مديونية)
                    if invoice.customer:
                        customer = invoice.customer
                        customer.balance += invoice.total
                        customer.save()
                    else:
                        raise Exception("يجب اختيار عميل مسجل لإتمام عملية البيع الآجل.")

                # 4. Log Treasury entry (Inflow) - ONLY for CASH/INSTALLMENT (non-credit)
                if payment_type != 'CREDIT':
                    Treasury.objects.create(
                        transaction_type='دخل',
                        amount=total_amount,
                        reason=f"Sales Invoice Income: {invoice_num}",
                        shift=active_shift
                    )

                return Response(
                    {"message": "تمت العملية بنجاح وتحديث المخزن والماليات. ✅", "invoice_id": invoice.id},
                    status=status.HTTP_201_CREATED,
                )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



# ── 3. الموظفون ───────────────────────────────────────────────────────────────
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    @action(detail=True, methods=['post'])
    def pay_salary(self, request, pk=None):
        """Pays net salary: Checks Treasury -> Deducts -> Logs Expense & Treasury"""
        employee = self.get_object()
        net_salary = float(employee.netSalary)

        # Apply tax from settings
        settings = SystemSettings.get_settings()
        tax_rate = float(settings.payroll_tax_rate) / 100
        tax_deduction = float(employee.baseSalary) * tax_rate
        net_salary = float(employee.netSalary) - tax_deduction

        current_balance = get_treasury_balance()
        if current_balance < net_salary:
            return Response({"error": "Insufficient Treasury balance to pay salary."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Deduction log
                Treasury.objects.create(
                    transaction_type='خرج',
                    amount=net_salary,
                    reason=f"Salary Payment (after {settings.payroll_tax_rate}% tax): {employee.name}"
                )
                Expense.objects.create(
                    type="Salary Payment",
                    category="other",
                    amount=net_salary,
                    notes=f"Full salary payment for {employee.name}"
                )
                return Response({"message": f"Salary of {net_salary} paid successfully to {employee.name} ✅"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def record_advance(self, request, pk=None):
        """Records a salary advance: Checks Treasury -> Deducts -> Updates Employee Record"""
        amount = float(request.data.get('amount', 0))
        employee = self.get_object()

        settings = SystemSettings.get_settings()
        if amount > float(settings.max_advance_limit):
             return Response({"error": f"Advance exceeds monthly limit ({settings.max_advance_limit} ج.م)"}, status=status.HTTP_400_BAD_REQUEST)

        current_balance = get_treasury_balance()
        if current_balance < amount:
            return Response({"error": "Insufficient Treasury balance for advance."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                employee.advances += Decimal(str(amount))
                employee.save()
                Treasury.objects.create(
                    transaction_type='خرج',
                    amount=amount,
                    reason=f"Salary Advance: {employee.name}"
                )
                return Response({"message": f"Advance of {amount} recorded for {employee.name} ✅"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── 4. المصاريف ───────────────────────────────────────────────────────────────
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def perform_create(self, serializer):
        """Unified Expense logic: Check Treasury -> Deduct -> Log Ledger Entry"""
        amount = serializer.validated_data.get('amount', 0)
        current_balance = get_treasury_balance()
        
        if current_balance < amount:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"error": "Insufficient Treasury balance for this expense."})

        expense = serializer.save()
        Treasury.objects.create(
            transaction_type='خرج',
            amount=expense.amount,
            reason=f"General Expense: {expense.type}",
        )


# ── 5. العملاء ────────────────────────────────────────────────────────────────
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


# ── 6. الخزينة ────────────────────────────────────────────────────────────────
class TreasuryViewSet(viewsets.ModelViewSet):
    queryset = Treasury.objects.all()
    serializer_class = TreasurySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


# ── 7. الورديات ───────────────────────────────────────────────────────────────
class WorkShiftViewSet(viewsets.ModelViewSet):
    queryset = WorkShift.objects.all()
    serializer_class = WorkShiftSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    @action(detail=False, methods=['get'])
    def active(self, request):
        shift = WorkShift.objects.filter(
            user=request.user, end_time__isnull=True
        ).first()
        if shift:
            return Response(WorkShiftSerializer(shift).data)
        return Response({"active": False}, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        active_exists = WorkShift.objects.filter(
            user=self.request.user, end_time__isnull=True
        ).exists()
        if active_exists:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"error": "لديك وردية مفتوحة بالفعل، يجب إغلاقها قبل فتح واحدة جديدة."}
            )
        serializer.save(user=self.request.user)


# ── 8. الأقساط ────────────────────────────────────────────────────────────────
class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Pays an installment: Marks as paid -> Adds to Treasury"""
        installment = self.get_object()
        if installment.is_paid:
            return Response({"error": "This installment is already paid."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                installment.is_paid = True
                installment.remaining_amount = 0
                installment.save()

                # Add income toTreasury
                Treasury.objects.create(
                    transaction_type='دخل',
                    amount=installment.amount,
                    reason=f"Installment Payment - Invoice: {installment.invoice.invoice_number}"
                )
                return Response({"message": "Installment paid successfully and added to Treasury. ✅"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── 9. الموردون ───────────────────────────────────────────────────────────────
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


# ── 10. المشتريات ─────────────────────────────────────────────────────────────
class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def create(self, request, *args, **kwargs):
        """Unified purchase logic: Check Treasury -> Increase Stock -> Log Movement -> Deduct Treasury"""
        data = request.data
        qty = int(data.get('quantity', 0))
        cost_price = float(data.get('cost_price', 0))
        total_cost = qty * cost_price
        product_id = data.get('product')

        # Treasury balance check (Prevention of Overdraft)
        current_balance = get_treasury_balance()
        if current_balance < total_cost:
            return Response(
                {"error": f"Insufficient Treasury balance. Current: {current_balance}, Required: {total_cost}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # 1. Increase Stock
                product = Product.objects.select_for_update().get(id=product_id)
                product.current_stock += qty
                product.save()

                # 2. Log Stock Movement
                StockMovement.objects.create(
                    product=product,
                    type='PURCHASE',
                    quantity=qty,
                    reason=f"Purchase from Supplier"
                )

                # 3. Log Treasury Outflow (خرج)
                Treasury.objects.create(
                    transaction_type='خرج',
                    amount=total_cost,
                    reason=f"Purchase of {qty} units of {product.name}",
                )

                # 4. Save Purchase Record
                return super().create(request, *args, **kwargs)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── 11. حركات المخزن ──────────────────────────────────────────────────────────
class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

# ── 12. المناديب ──────────────────────────────────────────────────────────────
class SalesRepresentativeViewSet(viewsets.ModelViewSet):
    queryset = SalesRepresentative.objects.all()
    serializer_class = SalesRepresentativeSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

# ── 13. لوحة التحكم (Analytics) ──────────────────────────────────────────────
class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Returns KPI card data."""
        today = timezone.now().date()
        
        daily_sales = Invoice.objects.filter(created_at__date=today).aggregate(Sum('total'))['total__sum'] or 0
        daily_collections = Treasury.objects.filter(transaction_type='دخل', date__date=today).aggregate(Sum('amount'))['amount__sum'] or 0
        alerts_count = Product.objects.filter(current_stock__lte=F('min_stock_level')).count()
        active_reps = SalesRepresentative.objects.filter(is_active=True).count()

        return Response({
            "daily_sales": daily_sales,
            "daily_collections": daily_collections,
            "alerts_count": alerts_count,
            "active_reps": active_reps
        })

    @action(detail=False, methods=['get'])
    def sales_chart(self, request):
        """Returns sales records for the last 7 days."""
        last_7_days = timezone.now() - timezone.timedelta(days=7)
        
        sales_by_day = Invoice.objects.filter(created_at__gte=last_7_days) \
            .annotate(day=TruncDay('created_at')) \
            .values('day') \
            .annotate(total=Sum('total')) \
            .order_by('day')

        return Response(sales_by_day)

    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        """Returns combined last 10 activities from Treasury & Movements."""
        # Simple implementation: fetch last 10 movements
        movements = StockMovement.objects.order_by('-created_at')[:10]
        treasury = Treasury.objects.order_by('-date')[:10]
        
        # Format for UI
        activities = []
        for m in movements:
            activities.append({
                "id": f"m-{m.id}",
                "type": m.type.lower(),
                "message": f"{m.get_type_display()}: {m.product.name} ({int(m.quantity)})",
                "time": m.created_at,
                "color": "#3B82F6" if m.type == 'SALE' else "#F59E0B"
            })
            
        for t in treasury:
            activities.append({
                "id": f"t-{t.id}",
                "type": "payment" if t.transaction_type == 'دخل' else "expense",
                "message": t.reason,
                "time": t.date,
                "color": "#10B981" if t.transaction_type == 'دخل' else "#EF4444"
            })
            
        # Re-sort by time and take top 10
        activities.sort(key=lambda x: x['time'], reverse=True)
        return Response(activities[:10])
