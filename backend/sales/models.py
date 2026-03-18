

from django.db import models
from django.contrib.auth.models import User
from inventory.models import Product  # ربط مع المخازن
from customers.models import Customer # ربط مع العملاء

# 1. موديل الوردية
class WorkShift(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="الموظف")
    start_time = models.DateTimeField(auto_now_add=True, verbose_name="وقت البدء")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="وقت الإغلاق")
    is_open = models.BooleanField(default=True, verbose_name="هل الوردية مفتوحة؟")
    starting_cash = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="الرصيد الافتتاحي")

    def __str__(self):
        return f"وردية {self.user.username} - {self.start_time.date()}"

# 2. موديل الفاتورة
class Invoice(models.Model):
    PAYMENT_METHODS = [('CASH', 'نقدي'), ('CREDIT', 'آجل'), ('INSTALLMENT', 'تقسيط')]
    
    invoice_number = models.CharField(max_length=50, unique=True, verbose_name="رقم الفاتورة")
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="العميل")
    
    # ✅ التعديل هنا: جعل الوردية اختيارية (null=True, blank=True)
    shift = models.ForeignKey(WorkShift, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="الوردية")
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="الإجمالي")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='CASH', verbose_name="طريقة الدفع")
    is_anomaly = models.BooleanField(default=False, verbose_name="فاتورة مشبوهة") # للذكاء الاصطناعي
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):  
        return f"فاتورة رقم {self.invoice_number}"

# 3. أصناف الفاتورة
class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, verbose_name="المنتج")
    quantity = models.PositiveIntegerField(default=1, verbose_name="الكمية")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="سعر الوحدة")
    line_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="إجمالي الصنف", default=0)

    def save(self, *args, **kwargs):
        # حساب الإجمالي تلقائياً قبل الحفظ
        self.line_total = self.unit_price * self.quantity
        super().save(*args, **kwargs)

# 4. جدول خطة التقسيط (البيانات العامة للتقسيط)
class InstallmentPlan(models.Model):
    invoice = models.OneToOneField(Invoice, on_delete=models.CASCADE, related_name='installment_plan', verbose_name="الفاتورة")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name="العميل")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="إجمالي مبلغ التقسيط")
    down_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="المقدم المدفوع")
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="المبلغ المتبقي")
    installments_count = models.PositiveIntegerField(verbose_name="عدد الأقساط")
    start_date = models.DateField(verbose_name="تاريخ أول قسط")
    is_completed = models.BooleanField(default=False, verbose_name="هل اكتمل السداد؟")

    def __str__(self):
        return f"خطة تقسيط - {self.customer.name} - فاتورة {self.invoice.invoice_number}"

# 5. جدول الأقساط الفردية (تفاصيل كل شهر)
class Installment(models.Model):
    STATUS_CHOICES = [('PENDING', 'قيد الانتظار'), ('PAID', 'تم الدفع'), ('LATE', 'متأخر')]
    
    plan = models.ForeignKey(InstallmentPlan, on_delete=models.CASCADE, related_name='installments', verbose_name="خطة التقسيط")
    due_date = models.DateField(verbose_name="تاريخ الاستحقاق")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="مبلغ القسط")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="حالة القسط")
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الدفع الفعلي")

    def __str__(self):
        return f"قست بتاريخ {self.due_date} بمبلغ {self.amount}"

