from django.db import models
from django.contrib.auth.models import User
from inventory.models import Employee


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'حاضر'),
        ('absent', 'غائب'),
        ('late', 'متأخر'),
        ('excused', 'إذن'),
        ('holiday', 'إجازة'),
    ]

    employee   = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                   related_name='attendance_records',
                                   verbose_name='الموظف')
    date       = models.DateField(verbose_name='التاريخ')
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                  default='present', verbose_name='الحالة')
    check_in   = models.TimeField(null=True, blank=True, verbose_name='وقت الحضور')
    check_out  = models.TimeField(null=True, blank=True, verbose_name='وقت الانصراف')
    late_minutes = models.PositiveIntegerField(default=0, verbose_name='دقائق التأخير')
    notes      = models.TextField(blank=True, verbose_name='ملاحظات')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL,
                                    null=True, blank=True,
                                    verbose_name='سجّل بواسطة')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']
        verbose_name = 'سجل حضور'
        verbose_name_plural = 'سجلات الحضور'

    def __str__(self):
        return f"{self.employee.name} - {self.date} - {self.get_status_display()}"


class PayrollRun(models.Model):
    STATUS_CHOICES = [
        ('draft', 'مسودة'),
        ('approved', 'معتمد'),
        ('paid', 'مدفوع'),
    ]

    month       = models.PositiveIntegerField(verbose_name='الشهر')
    year        = models.PositiveIntegerField(verbose_name='السنة')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                   default='draft', verbose_name='الحالة')
    total_gross = models.DecimalField(max_digits=12, decimal_places=2,
                                      default=0, verbose_name='إجمالي الرواتب')
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2,
                                           default=0, verbose_name='إجمالي الخصومات')
    total_net   = models.DecimalField(max_digits=12, decimal_places=2,
                                      default=0, verbose_name='صافي الرواتب')
    notes       = models.TextField(blank=True, verbose_name='ملاحظات')
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL,
                                    null=True, verbose_name='أنشأه')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL,
                                    null=True, blank=True,
                                    related_name='approved_payrolls',
                                    verbose_name='اعتمده')
    paid_at     = models.DateTimeField(null=True, blank=True,
                                       verbose_name='تاريخ الصرف')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('month', 'year')
        ordering = ['-year', '-month']
        verbose_name = 'مسير رواتب'
        verbose_name_plural = 'مسيرات الرواتب'

    def __str__(self):
        return f"مسير {self.month}/{self.year} - {self.get_status_display()}"


class SalarySlip(models.Model):
    payroll_run  = models.ForeignKey(PayrollRun, on_delete=models.CASCADE,
                                     related_name='slips',
                                     verbose_name='مسير الراتب')
    employee     = models.ForeignKey(Employee, on_delete=models.CASCADE,
                                     related_name='salary_slips',
                                     verbose_name='الموظف')
    base_salary  = models.DecimalField(max_digits=10, decimal_places=2,
                                       verbose_name='الراتب الأساسي')
    incentives   = models.DecimalField(max_digits=10, decimal_places=2,
                                       default=0, verbose_name='الحوافز')
    advances     = models.DecimalField(max_digits=10, decimal_places=2,
                                       default=0, verbose_name='السلف')
    deductions   = models.DecimalField(max_digits=10, decimal_places=2,
                                       default=0, verbose_name='خصومات أخرى')
    absent_days  = models.PositiveIntegerField(default=0,
                                               verbose_name='أيام الغياب')
    late_deduction = models.DecimalField(max_digits=10, decimal_places=2,
                                         default=0, verbose_name='خصم التأخير')
    net_salary   = models.DecimalField(max_digits=10, decimal_places=2,
                                       verbose_name='صافي الراتب')
    notes        = models.TextField(blank=True, verbose_name='ملاحظات')
    is_paid      = models.BooleanField(default=False, verbose_name='مدفوع؟')
    paid_at      = models.DateTimeField(null=True, blank=True,
                                        verbose_name='تاريخ الدفع')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('payroll_run', 'employee')
        ordering = ['employee__name']
        verbose_name = 'قسيمة راتب'
        verbose_name_plural = 'قسائم الرواتب'

    def __str__(self):
        return f"{self.employee.name} - {self.payroll_run}"

    def calculate_net(self):
        self.net_salary = (
            self.base_salary
            + self.incentives
            - self.advances
            - self.deductions
            - self.late_deduction
        )
        return self.net_salary
