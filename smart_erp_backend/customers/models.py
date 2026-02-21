from django.db import models

class Customer(models.Model):
    name = models.CharField(max_length=255, verbose_name="اسم العميل")
    phone = models.CharField(max_length=20, verbose_name="رقم التليفون")
    email = models.EmailField(blank=True, null=True, verbose_name="البريد الإلكتروني")
    address = models.TextField(blank=True, null=True, verbose_name="العنوان")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="الرصيد")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name