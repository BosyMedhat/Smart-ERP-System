from django.db import models
from django.contrib.auth.models import User

# 1. المنتجات
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
    image = models.ImageField("صورة المنتج", upload_to='products/', null=True, blank=True)
    category = models.CharField("التصنيف", max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

# 2. حركات المخزن
class StockMovement(models.Model):
    TYPES = [('SALE', 'بيع'), ('PURCHASE', 'شراء'), ('ADJUST', 'تعديل')]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    type = models.CharField(max_length=10, choices=TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

# 3. إدارة العملاء
class Customer(models.Model):
    name = models.CharField("اسم العميل", max_length=255)
    phone = models.CharField("رقم الهاتف", max_length=20, unique=True, null=True, blank=True)
    balance = models.DecimalField("المديونية", max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.name

# 4. الورديات
class WorkShift(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    starting_cash = models.DecimalField(max_digits=10, decimal_places=2)
    actual_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

# 4.5 المناديب (Sales Representatives)
class SalesRepresentative(models.Model):
    name = models.CharField("اسم المندوب", max_length=255)
    phone = models.CharField("رقم الهاتف", max_length=20)
    target_sales = models.DecimalField("المبيعات المستهدفة", max_digits=12, decimal_places=2, default=100000)
    commission_rate = models.DecimalField("نسبة العمولة (%)", max_digits=5, decimal_places=2, default=3.0)
    is_active = models.BooleanField("نشط", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# 5. الفواتير
class Invoice(models.Model):
    TYPES = [('CASH', 'نقدي'), ('INSTALLMENT', 'تقسيط'), ('CREDIT', 'آجل')]
    invoice_number = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    representative = models.ForeignKey(SalesRepresentative, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    shift = models.ForeignKey(WorkShift, on_delete=models.CASCADE, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Total VAT (14%)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Total Discount applied
    payment_type = models.CharField(max_length=20, choices=TYPES, default='CASH')
    created_at = models.DateTimeField(auto_now_add=True)

# 6. الأقساط
class Installment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='installments')
    due_date = models.DateField("تاريخ الاستحقاق")
    amount = models.DecimalField("إجمالي مبلغ القسط", max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField("المبلغ المتبقي", max_digits=10, decimal_places=2)
    installments_count = models.IntegerField("عدد الأقساط", default=1)
    is_paid = models.BooleanField("هل تم السداد؟", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk and self.remaining_amount is None:
            self.remaining_amount = self.amount
        super().save(*args, **kwargs)

# 7. الموردين
class Supplier(models.Model):
    name = models.CharField("اسم المورد", max_length=255)
    phone = models.CharField("رقم الهاتف", max_length=20, null=True, blank=True)
    company = models.CharField("الشركة", max_length=255, null=True, blank=True)

# 8. المشتريات
class Purchase(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

# 9. المصاريف
class Expense(models.Model):
    CATEGORIES = [('rent', 'إيجار'), ('electricity', 'كهرباء'), ('maintenance', 'صيانة'), ('other', 'أخرى')]
    type = models.CharField("بند المصروف", max_length=255)
    category = models.CharField("الفئة", max_length=20, choices=CATEGORIES, default='other')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField("ملاحظات", null=True, blank=True)
    date = models.DateField(auto_now_add=True)

# 10. الخزينة
class Treasury(models.Model):
    TYPES = [('دخل', 'دخل'), ('خرج', 'خرج')]
    transaction_type = models.CharField(max_length=10, choices=TYPES, default='دخل')
    amount = models.DecimalField("المبلغ", max_digits=12, decimal_places=2, default=0)
    reason = models.CharField("السبب", max_length=255, null=True, blank=True)
    shift = models.ForeignKey(WorkShift, on_delete=models.CASCADE, null=True, blank=True, related_name='treasury_actions')
    date = models.DateTimeField(auto_now_add=True)

# 11. الموظفين
class Employee(models.Model):
    name = models.CharField("اسم الموظف", max_length=255)
    position = models.CharField("المسمى الوظيفي", max_length=100)
    baseSalary = models.DecimalField("الراتب الأساسي", max_digits=10, decimal_places=2)
    advances = models.DecimalField("السلف", max_digits=10, decimal_places=2, default=0)
    incentives = models.DecimalField("الحوافز", max_digits=10, decimal_places=2, default=0)
    attendance = models.CharField("الحضور", max_length=20, default='present')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def netSalary(self):
        return self.baseSalary + self.incentives - self.advances