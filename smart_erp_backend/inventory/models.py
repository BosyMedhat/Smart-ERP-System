from django.db import models

# 1. جدول المنتجات - لربطه بشاشة InventoryScreen.tsx
class Product(models.Model):
    sku = models.CharField("الباركود", max_length=100, unique=True)
    name = models.CharField("اسم المنتج", max_length=255)
    unit = models.CharField("الوحدة", max_length=50, default="قطعة")
    cost_price = models.DecimalField("سعر التكلفة", max_digits=10, decimal_places=2)
    retail_price = models.DecimalField("سعر القطاعي", max_digits=10, decimal_places=2)
    wholesale_price = models.DecimalField("سعر الجملة", max_digits=10, decimal_places=2, null=True, blank=True)
    current_stock = models.DecimalField("الكمية الحالية", max_digits=10, decimal_places=2, default=0)
    min_stock_level = models.DecimalField("حد الطلب", max_digits=10, decimal_places=2, default=5)
    expiry_date = models.DateField("تاريخ الصلاحية", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

# 2. جدول حركات المخزن - لمراقبة العمليات والذكاء الاصطناعي
class StockMovement(models.Model):
    TYPES = [('SALE', 'بيع'), ('PURCHASE', 'شراء'), ('ADJUST', 'تعديل')]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    type = models.CharField(max_length=10, choices=TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)



    # 3. إدارة العملاء - لدعم شاشات المبيعات والتقسيط
class Customer(models.Model):
    name = models.CharField("اسم العميل", max_length=255)
    phone = models.CharField("رقم الهاتف", max_length=20, unique=True, null=True, blank=True)
    balance = models.DecimalField("المديونية", max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.name

# 4. الورديات - ضروري لإغلاق الصندوق (ShiftClosingModal.tsx)
class WorkShift(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    starting_cash = models.DecimalField(max_digits=10, decimal_places=2)
    actual_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

# 5. الفواتير والتقسيط - القلب النابض لشاشة POS و Installments
class Invoice(models.Model):
    TYPES = [('CASH', 'نقدي'), ('INSTALLMENT', 'تقسيط')]
    invoice_number = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    shift = models.ForeignKey(WorkShift, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=TYPES, default='CASH')
    created_at = models.DateTimeField(auto_now_add=True)

class Installment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='installments')
    due_date = models.DateField("تاريخ الاستحقاق")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)