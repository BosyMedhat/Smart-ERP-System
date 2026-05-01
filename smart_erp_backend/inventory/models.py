from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver as signal_receiver

# 1. المنتجات
class Product(models.Model):
    sku = models.CharField("الSKU", max_length=100, unique=True)
    barcode = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        verbose_name='الباركود'
    )
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

# 2. حركات المخزن
class StockMovement(models.Model):
    TYPES = [('SALE', 'بيع'), ('PURCHASE', 'شراء'), ('ADJUST', 'تعديل')]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    type = models.CharField(max_length=10, choices=TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

# 3. الورديات
class WorkShift(models.Model):
    STATUS_CHOICES = [
        ('open', 'مفتوحة'),
        ('closed', 'مغلقة'),
    ]

    user           = models.ForeignKey('auth.User', on_delete=models.CASCADE,
                                       verbose_name='المستخدم')
    shift_date     = models.DateField(default='2024-01-01', verbose_name='تاريخ الوردية')
    start_time     = models.DateTimeField(auto_now_add=True, verbose_name='وقت البداية')
    end_time       = models.DateTimeField(null=True, blank=True,
                                          verbose_name='وقت النهاية')
    starting_cash  = models.DecimalField(max_digits=10, decimal_places=2,
                                         verbose_name='رصيد أول الوردية')
    actual_cash    = models.DecimalField(max_digits=10, decimal_places=2,
                                         null=True, blank=True,
                                         verbose_name='الكاش الفعلي')
    expected_cash  = models.DecimalField(max_digits=10, decimal_places=2,
                                         null=True, blank=True,
                                         verbose_name='الكاش المتوقع')
    difference     = models.DecimalField(max_digits=10, decimal_places=2,
                                         null=True, blank=True,
                                         verbose_name='الفرق')
    total_sales    = models.DecimalField(max_digits=10, decimal_places=2,
                                         default=0, verbose_name='إجمالي المبيعات')
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES,
                                      default='open', verbose_name='الحالة')
    notes          = models.TextField(blank=True, verbose_name='ملاحظات')
    created_at     = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        ordering = ['-start_time']
        verbose_name = 'وردية'
        verbose_name_plural = 'الورديات'

    def __str__(self):
        return f"{self.user.username} - {self.shift_date} - {self.get_status_display()}"

    def close_shift(self, actual_cash, notes=''):
        from django.utils import timezone
        self.end_time = timezone.now()
        self.actual_cash = actual_cash
        self.difference = actual_cash - (self.expected_cash or 0)
        self.status = 'closed'
        self.notes = notes
        self.save()

# 5. الفواتير
class Invoice(models.Model):
    TYPES = [('CASH', 'نقدي'), ('INSTALLMENT', 'تقسيط')]
    invoice_number = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True)
    shift = models.ForeignKey(WorkShift, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=TYPES, default='CASH')
    created_at = models.DateTimeField(auto_now_add=True)

# 6. الأقساط (مربوط بـ Sale مباشرة)
class Installment(models.Model):
    sale = models.ForeignKey(
        'Sale', on_delete=models.CASCADE,
        related_name='installments',
        verbose_name='فاتورة البيع',
        null=True, blank=True
    )
    down_payment = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        verbose_name='المقدم'
    )
    months_count = models.IntegerField(default=1, verbose_name='عدد الأشهر')
    amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        verbose_name='إجمالي مبلغ التقسيط'
    )
    remaining_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        verbose_name='المبلغ المتبقي'
    )
    due_date = models.DateField(verbose_name='تاريخ أول قسط')
    is_paid = models.BooleanField(default=False, verbose_name='هل تم السداد الكامل؟')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk and self.remaining_amount is None:
            self.remaining_amount = self.amount
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'قسط'
        verbose_name_plural = 'الأقساط'

    def __str__(self):
        return f"قسط فاتورة {self.sale.invoice_number} - متبقي: {self.remaining_amount}"

# 7. الموردين
class Supplier(models.Model):
    name = models.CharField("اسم المورد", max_length=255)
    phone = models.CharField("رقم الهاتف", max_length=20, null=True, blank=True)
    email = models.EmailField("البريد الإلكتروني", null=True, blank=True)
    company = models.CharField("الشركة", max_length=255, null=True, blank=True)
    address = models.TextField("العنوان", null=True, blank=True)
    balance = models.DecimalField("الرصيد المستحق", max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "مورد"
        verbose_name_plural = "الموردين"

    def __str__(self):
        return self.name

# 8. المشتريات
class Purchase(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchases', verbose_name="المورد")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="المنتج")
    quantity = models.DecimalField("الكمية", max_digits=10, decimal_places=2)
    cost_price = models.DecimalField("سعر التكلفة", max_digits=10, decimal_places=2)
    total_amount = models.DecimalField("الإجمالي", max_digits=12, decimal_places=2, default=0)
    invoice_number = models.CharField("رقم الفاتورة", max_length=100, null=True, blank=True)
    notes = models.TextField("ملاحظات", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_amount = self.quantity * self.cost_price
        # Update product stock and cost price
        if self.product:
            self.product.current_stock = (self.product.current_stock or 0) + float(self.quantity)
            self.product.cost_price = self.cost_price
            self.product.save()
        # Add to supplier balance
        if not self.pk:
            self.supplier.balance += self.total_amount
            self.supplier.save()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "مشتريات"
        verbose_name_plural = "المشتريات"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.supplier.name} - {self.product.name} x{self.quantity}"

# 9. المصاريف (معدل ليتوافق مع Modal الموظفين)
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
    date = models.DateTimeField(auto_now_add=True)

# 11. الموظفين (معدل ليناسب كود React تماماً)
class Employee(models.Model):
    user = models.OneToOneField(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_profile',
        verbose_name='حساب المستخدم'
    )
    name = models.CharField("اسم الموظف", max_length=255)
    position = models.CharField("المسمى الوظيفي", max_length=100)
    baseSalary = models.DecimalField("الراتب الأساسي", max_digits=10, decimal_places=2)
    advances = models.DecimalField("السلف", max_digits=10, decimal_places=2, default=0)
    incentives = models.DecimalField("الحوافز", max_digits=10, decimal_places=2, default=0)
    attendance = models.CharField("الحضور", max_length=20, default='present')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def netSalary(self): # سيظهر في الريآكت كـ netSalary
        return self.baseSalary + self.incentives - self.advances

# 12. UserProfile — RBAC
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('مدير', 'مدير النظام'),
        ('كاشير', 'كاشير'),
        ('محاسب', 'محاسب'),
        ('أمين مخزن', 'أمين مخزن'),
    ]
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='userprofile'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='كاشير'
    )
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username} — {self.role}"

@signal_receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


# 13. StoreSettings — إعدادات المتجر
class StoreSettings(models.Model):
    # معلومات الشركة (Company Info)
    store_name = models.CharField(max_length=200, default='Smart ERP', verbose_name='اسم المتجر')
    system_name = models.CharField(max_length=100, default='Smart ERP', verbose_name='اسم النظام')
    currency = models.CharField(max_length=10, default='EGP', verbose_name='العملة')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=14.00, verbose_name='نسبة الضريبة')
    phone = models.CharField(max_length=20, blank=True, default='', verbose_name='رقم الهاتف')
    address = models.TextField(blank=True, default='', verbose_name='العنوان')
    email = models.EmailField(blank=True, default='', verbose_name='البريد الإلكتروني')
    store_logo = models.ImageField(upload_to='logos/', null=True, blank=True, verbose_name='شعار المتجر')

    # الفواتير والمبيعات (Invoices & Sales)
    invoice_prefix = models.CharField(max_length=10, default='INV', verbose_name='بادئة الفاتورة')
    invoice_starting_number = models.IntegerField(default=1, verbose_name='رقم بداية الفواتير')
    invoice_due_days = models.IntegerField(default=30, verbose_name='أيام استحقاق الفاتورة')
    show_tax_on_invoice = models.BooleanField(default=True, verbose_name='إظهار الضريبة في الفاتورة')
    invoice_notes = models.TextField(blank=True, default='', verbose_name='ملاحظات ثابتة في الفاتورة')

    # الأمان (Security)
    session_timeout_hours = models.IntegerField(default=8, verbose_name='مدة الجلسة بالساعات')
    max_login_attempts = models.IntegerField(default=5, verbose_name='محاولات الدخول المسموحة')
    lockout_duration_minutes = models.IntegerField(default=30, verbose_name='مدة الحظر بالدقائق')

    # المظهر واللغة (Appearance & Language)
    primary_color = models.CharField(max_length=7, default='#3B82F6', verbose_name='اللون الأساسي')
    language = models.CharField(max_length=10, default='ar', verbose_name='اللغة', choices=[('ar', 'العربية'), ('en', 'English')])
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY', verbose_name='تنسيق التاريخ', choices=[('DD/MM/YYYY', 'DD/MM/YYYY'), ('MM/DD/YYYY', 'MM/DD/YYYY'), ('YYYY-MM-DD', 'YYYY-MM-DD')])

    # الحالة (Status)
    is_configured = models.BooleanField(default=False, verbose_name='تم الإعداد')

    class Meta:
        verbose_name = 'إعدادات المتجر'
        verbose_name_plural = 'إعدادات المتجر'

    def save(self, *args, **kwargs):
        # Singleton — دائماً record واحد فقط
        self.pk = 1
        super().save(*args, **kwargs)


# ==================== SALE MODULE (NEW) ====================
# 14. فواتير المبيعات (جدول منفصل لدورة البيع POS)
class Sale(models.Model):
    PAYMENT_TYPES = [
        ('cash', 'كاش'),
        ('vodafone_cash', 'فودافون كاش'),
        ('instapay', 'انستاباي'),
        ('card', 'بطاقة بنكية'),
        ('credit', 'آجل'),
        ('installment', 'تقسيط'),
    ]

    invoice_number = models.CharField(
        max_length=50, unique=True, editable=False,
        verbose_name='رقم الفاتورة'
    )
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name='العميل'
    )
    cashier = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        verbose_name='الكاشير'
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name='الإجمالي'
    )
    discount = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name='الخصم'
    )
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        verbose_name='مبلغ الضريبة'
    )
    final_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name='المبلغ النهائي'
    )
    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPES,
        default='cash',
        verbose_name='طريقة الدفع'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Get settings for prefix and starting number
            settings = StoreSettings.objects.first()
            prefix = settings.invoice_prefix if settings else 'INV'
            starting_num = settings.invoice_starting_number if settings else 1

            last = Sale.objects.order_by('-id').first()
            num = (last.id + starting_num) if last else starting_num
            self.invoice_number = f'{prefix}-{num:05d}'
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'فاتورة مبيعات'
        verbose_name_plural = 'فواتير المبيعات'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} - {self.final_amount} EGP"


# 15. تفاصيل أصناف الفاتورة
class SaleItem(models.Model):
    sale = models.ForeignKey(
        Sale, on_delete=models.CASCADE, related_name='items',
        verbose_name='الفاتورة'
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True,
        verbose_name='المنتج'
    )
    product_name = models.CharField(
        max_length=255, default='', verbose_name='اسم المنتج (Snapshot)',
        help_text='اسم المنتج وقت البيع (لا يتغير حتى لو تغير اسم المنتج لاحقاً)'
    )
    quantity = models.PositiveIntegerField(verbose_name='الكمية')
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        verbose_name='سعر الوحدة'
    )
    subtotal = models.DecimalField(
        max_digits=10, decimal_places=2,
        verbose_name='الإجمالي'
    )

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.unit_price
        # حفظ اسم المنتج عند الإنشاء
        if self.product and not self.product_name:
            self.product_name = self.product.name
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'صنف فاتورة'
        verbose_name_plural = 'أصناف الفواتير'

    def __str__(self):
        return f"{self.product.name if self.product else 'Unknown'} x{self.quantity}"