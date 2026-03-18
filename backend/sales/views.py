from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import action
from dateutil.relativedelta import relativedelta
import logging

logger = logging.getLogger(__name__)

from .models import Invoice, InvoiceItem, Installment, InstallmentPlan, Customer
from .serializers import InvoiceSerializer, InstallmentSerializer 
from inventory.models import Product

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer

class InvoiceListCreateView(APIView):
    
    @transaction.atomic
    def post(self, request):
        try:
            data = request.data
            
            # تنظيف البيانات القادمة من الفرونت إيند
            payment_method = data.get('payment_method', 'CASH')
            
            # تجهيز البيانات للسيرياليزر
            invoice_data = {
                'invoice_number': data.get('invoice_number'),
                'customer': data.get('customer'),
                'total_amount': data.get('total_amount'),
                'payment_method': payment_method,
                'items': data.get('items', []),  # نمرر العناصر للسيرياليزر مباشرة
                'installments_count': data.get('installments_count'),
                'down_payment': data.get('down_payment', 0),
            }

            # السيرياليزر سيتولى الآن عملية (إنشاء الفاتورة + خصم المخزون + إنشاء الأقساط)
            # لأننا وضعنا هذا المنطق في دالة create داخل السيرياليزر في الرد السابق
            serializer = InvoiceSerializer(data=invoice_data)
            
            if serializer.is_valid():
                invoice = serializer.save()
                return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"CRITICAL ERROR: {str(e)}")
            return Response({"error": f"Backend Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ... باقي ملف InstallmentViewSet يظل كما هو دون تغيير
class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all().select_related('plan__customer', 'plan__invoice').order_by('due_date')
    serializer_class = InstallmentSerializer 
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        try:
            installment = self.get_object()
            if installment.status == 'PAID':
                return Response({'error': 'القسط مدفوع بالفعل'}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                installment.status = 'PAID'
                installment.paid_at = timezone.now()
                installment.save()
                
                plan = installment.plan
                plan.remaining_amount -= installment.amount
                if plan.remaining_amount <= 0:
                    plan.is_completed = True
                plan.save()
                
            return Response({'status': 'تم التحصيل بنجاح'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def create_manual(self, request):
        data = request.data
        try:
            with transaction.atomic():
                customer_name = data.get('customer_name')
                customer, _ = Customer.objects.get_or_create(name=customer_name)

                total_amount = float(data.get('total_amount', 0))
                down_payment = float(data.get('down_payment', 0))
                count = int(data.get('installments_count', 1))
                net_amount = total_amount - down_payment

                plan = InstallmentPlan.objects.create(
                    customer=customer,
                    total_amount=total_amount,
                    remaining_amount=net_amount
                )

                amount_per_month = net_amount / count
                start_date = timezone.now().date()
                
                for i in range(count):
                    due_date = start_date + relativedelta(months=i+1)
                    Installment.objects.create(
                        plan=plan,
                        amount=amount_per_month,
                        due_date=due_date,
                        status='PENDING'
                    )
                return Response({'status': 'تم إنشاء خطة التقسيط'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        all_inst = Installment.objects.all()
        
        return Response({
            'total_pending': sum(i.amount for i in all_inst.filter(status='PENDING')),
            'total_paid': sum(i.amount for i in all_inst.filter(status='PAID')),
            'late_count': all_inst.filter(status='PENDING', due_date__lt=today).count()
        }) 
# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.utils import timezone
# from .models import Invoice, Installment, InstallmentPlan
# from .serializers import InvoiceSerializer
# from rest_framework import serializers

# # نكتفي بالـ ViewSet لأنه أشمل
# class InvoiceViewSet(viewsets.ModelViewSet):
#     queryset = Invoice.objects.all().order_by('-created_at')
#     serializer_class = InvoiceSerializer

# # --- الموديل الجديد لإدارة الأقساط ---
# class InstallmentViewSet(viewsets.ModelViewSet):
#     queryset = Installment.objects.all().order_by('due_date')
    
#     # سننشئ Serializer بسيط هنا مؤقتاً أو يمكنك نقله لملف serializers.py
#     class InstallmentSerializer(serializers.ModelSerializer):
#         customer_name = serializers.CharField(source='plan.customer.name', read_only=True)
#         invoice_number = serializers.CharField(source='plan.invoice.invoice_number', read_only=True)
        
#         class Meta:
#             model = Installment
#             fields = '__all__'

#     serializer_class = InstallmentSerializer

#     # Action لتحصيل القسط
#     @action(detail=True, methods=['post'])
#     def pay(self, request, pk=None):
#         installment = self.get_object()
#         if installment.status == 'PAID':
#             return Response({'error': 'هذا القسط مدفوع بالفعل'}, status=status.HTTP_400_BAD_REQUEST)
        
#         installment.status = 'PAID'
#         installment.paid_at = timezone.now()
#         installment.save()
        
#         # تحديث المبلغ المتبقي في خطة التقسيط
#         plan = installment.plan
#         plan.remaining_amount -= installment.amount
#         if plan.remaining_amount <= 0:
#             plan.is_completed = True
#         plan.save()
        
#         return Response({'status': 'تم تحصيل القسط بنجاح'})

#     # Action لجلب إحصائيات سريعة للوحة التحكم
#     @action(detail=False, methods=['get'])
#     def stats(self, request):
#         all_installments = Installment.objects.all()
#         total_pending = sum(i.amount for i in all_installments.filter(status='PENDING'))
#         total_paid = sum(i.amount for i in all_installments.filter(status='PAID'))
#         late_count = all_installments.filter(status='PENDING', due_date__lt=timezone.now().date()).count()
        
#         return Response({
#             'total_pending': total_pending,
#             'total_paid': total_paid,
#             'late_count': late_count
#         })


#اخر تعديل قبل اضافة الاقسات 

# from django.shortcuts import render
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework import viewsets
# from django.db import transaction  # ✅ استيراد المعاملات لضمان سلامة البيانات

# from .models import Invoice, InvoiceItem
# from .serializers import InvoiceSerializer
# from inventory.models import Product  # ✅ استيراد موديل المنتج من تطبيق المخازن

# class InvoiceViewSet(viewsets.ModelViewSet):
#     queryset = Invoice.objects.all().order_by('-created_at')
#     serializer_class = InvoiceSerializer

# class InvoiceListCreateView(APIView):
    
#     @transaction.atomic  # ✅ ضمان أن الفاتورة لن تحفظ إلا إذا تم خصم المخزون بنجاح
#     def post(self, request):
#         data = request.data
        
#         # 1. إعداد بيانات الفاتورة الأساسية
#         invoice_data = {
#             'invoice_number': data.get('invoice_number'),
#             'customer': data.get('customer'),
#             'shift': data.get('shift'),
#             'total_amount': data.get('total_amount'),
#             'payment_method': data.get('payment_method', 'CASH'),
#         }
        
#         serializer = InvoiceSerializer(data=invoice_data)
        
#         if serializer.is_valid():
#             # 2. حفظ الفاتورة الأساسية
#             invoice = serializer.save()
            
#             # 3. معالجة الأصناف (Items) وخصم المخزون
#             items = data.get('items', [])
#             for item in items:
#                 try:
#                     product = Product.objects.get(id=item['product'])
                    
#                     # تحقق من توفر الكمية في المخزون
#                     if product.stock_quantity < item['quantity']:
#                         transaction.set_rollback(True) # إلغاء العملية بالكامل
#                         return Response(
#                             {"error": f"الكمية غير كافية للمنتج: {product.name}"},
#                             status=status.HTTP_400_BAD_REQUEST
#                         )
                    
#                     # خصم الكمية من المخزون
#                     product.stock_quantity -= item['quantity']
#                     product.save()
                    
#                     # حفظ صنف الفاتورة في جدول InvoiceItem مع السعر القادم من الفرونت إيند
#                     InvoiceItem.objects.create(
#                         invoice=invoice,
#                         product=product,
#                         quantity=item['quantity'],
#                         unit_price=item['unit_price'] # ✅ السعر من الفرونت إيند
#                     )
                    
#                 except Product.DoesNotExist:
#                     transaction.set_rollback(True)
#                     return Response(
#                         {"error": f"المنتج ID {item['product']} غير موجود"},
#                         status=status.HTTP_400_BAD_REQUEST
#                     )
            
#             return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
        
#         # طباعة الأخطاء في الـ Terminal للمتابعة
#         print("Serializer Errors:", serializer.errors)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




# from django.shortcuts import render
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# # Create your views here.
# from rest_framework import viewsets
# from .models import Invoice
# from .serializers import InvoiceSerializer

# class InvoiceViewSet(viewsets.ModelViewSet):
#     queryset = Invoice.objects.all().order_by('-created_at')
#     serializer_class = InvoiceSerializer    

# class InvoiceListCreateView(APIView):
#     def post(self, request):
#         serializer = InvoiceSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
        
#         # --- أضف هذا السطر لطباعة الخطأ الحقيقي في الـ Terminal ---
#         print("Serializer Errors:", serializer.errors)
#         # ---------------------------------------------------------
        
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)