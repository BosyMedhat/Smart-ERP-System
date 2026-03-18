import email

from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Customer # استيراد الموديل من نفس التطبيق

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'balance','address','email','created_at') # البيانات اللي تظهر في الجدول
    search_fields = ('name', 'phone') # البحث باسم العميل أو تليفونه