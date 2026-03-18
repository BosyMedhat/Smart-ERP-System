
from django.contrib import admin
from .models import WorkShift, Invoice, InvoiceItem, InstallmentPlan, Installment

# عرض أصناف الفاتورة داخل صفحة الفاتورة نفسها
class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0

# عرض الأقساط داخل خطة التقسيط
class InstallmentInline(admin.TabularInline):
    model = Installment
    extra = 0
    fields = ('due_date', 'amount', 'status', 'paid_at')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'total_amount', 'payment_method', 'created_at')
    list_filter = ('payment_method', 'created_at')
    search_fields = ('invoice_number', 'customer__name')
    inlines = [InvoiceItemInline]

@admin.register(InstallmentPlan)
class InstallmentPlanAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'customer', 'total_amount', 'remaining_amount', 'is_completed')
    list_filter = ('is_completed',)
    search_fields = ('customer__name', 'invoice__invoice_number')
    inlines = [InstallmentInline]

@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ('plan', 'due_date', 'amount', 'status')
    list_filter = ('status', 'due_date')

@admin.register(WorkShift)
class WorkShiftAdmin(admin.ModelAdmin):
    list_display = ('user', 'start_time', 'end_time', 'is_open', 'starting_cash')
    list_filter = ('is_open', 'start_time')

#اخر تعديل قبل اضافة الادمن
# from django.contrib import admin

# # Register your models here.
# from django.contrib import admin
# from .models import WorkShift, Invoice, InvoiceItem

# # عرض أصناف الفاتورة داخل صفحة الفاتورة نفسها
# class InvoiceItemInline(admin.TabularInline):
#     model = InvoiceItem
#     extra = 1

# @admin.register(Invoice)
# class InvoiceAdmin(admin.ModelAdmin):
#     list_display = ('invoice_number', 'customer', 'total_amount', 'payment_method', 'created_at')
#     list_filter = ('payment_method', 'created_at')
#     search_fields = ('invoice_number', 'customer__name')
#     inlines = [InvoiceItemInline]

# @admin.register(WorkShift)
# class WorkShiftAdmin(admin.ModelAdmin):
#     list_display = ('user', 'start_time', 'end_time', 'is_open', 'starting_cash')
#     list_filter = ('is_open', 'start_time')