from rest_framework import serializers
from .models import Invoice, InvoiceItem, InstallmentPlan, Installment
from inventory.models import Product
from django.db import transaction
from datetime import date
from dateutil.relativedelta import relativedelta

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['product', 'quantity', 'unit_price']

class InstallmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='plan.customer.name', read_only=True)
    invoice_number = serializers.CharField(source='plan.invoice.invoice_number', read_only=True, allow_null=True)
    plan_remaining = serializers.DecimalField(source='plan.remaining_amount', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Installment
        fields = ['id', 'customer_name', 'invoice_number', 'amount', 'due_date', 'status', 'plan_remaining']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    installments_count = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    down_payment = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False, allow_null=True)

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'customer', 'total_amount', 'payment_method', 'items', 'created_at', 'installments_count', 'down_payment']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        installments_count = validated_data.pop('installments_count', None)
        down_payment = validated_data.pop('down_payment', 0) or 0

        with transaction.atomic():
            invoice = Invoice.objects.create(**validated_data)

            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                
                # ✅ التعديل الجوهري: استخدام اسم الحقل الصحيح كما هو في الموديل (current_stock)
                if product.current_stock >= quantity:
                    # خصم الكمية من الحقل الصحيح
                    product.current_stock -= quantity
                    product.save()
                    
                    InvoiceItem.objects.create(
                        invoice=invoice, 
                        product=product,
                        quantity=quantity,
                        unit_price=item_data['unit_price']
                    )
                else:
                    raise serializers.ValidationError({
                        "error": f"الكمية غير كافية للمنتج: {product.name}",
                        "details": f"المتاح حالياً {product.current_stock} وأنت تطلب {quantity}"
                    })

            # منطق التقسيط
            if invoice.payment_method == 'INSTALLMENT' and installments_count:
                remaining_amount = invoice.total_amount - down_payment
                plan = InstallmentPlan.objects.create(
                    invoice=invoice,
                    customer=invoice.customer,
                    total_amount=invoice.total_amount,
                    down_payment=down_payment,
                    remaining_amount=remaining_amount,
                    installments_count=installments_count,
                    start_date=date.today() + relativedelta(months=1)
                )

                amount_per_installment = remaining_amount / installments_count
                for i in range(installments_count):
                    Installment.objects.create(
                        plan=plan,
                        due_date=plan.start_date + relativedelta(months=i),
                        amount=amount_per_installment
                    )

            return invoice

#اخر تشغيل الفراتير

# from rest_framework import serializers
# from .models import Invoice, InvoiceItem
# from inventory.models import Product
# from django.db import transaction # استيراد الترانزكشن

# class InvoiceItemSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = InvoiceItem
#         fields = ['product', 'quantity', 'unit_price']

# class InvoiceSerializer(serializers.ModelSerializer):
#     items = InvoiceItemSerializer(many=True)

#     class Meta:
#         model = Invoice
#         fields = ['id', 'invoice_number', 'customer', 'total_amount', 'payment_method', 'items', 'created_at']

#     def create(self, validated_data):
#         items_data = validated_data.pop('items')
        
#         # استخدام atomic transaction لضمان سلامة البيانات
#         with transaction.atomic():
#             # 1. إنشاء الفاتورة
#             invoice = Invoice.objects.create(**validated_data)

#             # 2. إنشاء العناصر وخصم المخزون
#             for item_data in items_data:
#                 product = item_data['product']
#                 quantity = item_data['quantity']

#                 # خصم الكمية من المخزون
#                 # ✅ تم التعديل هنا: استخدام الاسم الصحيح 'current_stock'
#                 if product.current_stock >= quantity:
#                     product.current_stock -= quantity
#                     product.save()
                    
#                     # إنشاء العنصر في الفاتورة
#                     InvoiceItem.objects.create(invoice=invoice, **item_data)
#                 else:
#                     # في حال فشل خصم المخزون، يتم رفع خطأ وإلغاء العملية بالكامل
#                     raise serializers.ValidationError({
#                         "error": f"الكمية غير متوفرة للمنتج: {product.name}. المخزون الحالي: {product.current_stock}"
#                     })

#             return invoice
