from django.contrib import admin

from .models import Product, StockMovement, Customer, WorkShift, Invoice, Installment

admin.site.register(Product) # السطر ده مهم جداً عشان تضيف منتجات
admin.site.register(Customer)
admin.site.register(WorkShift)
admin.site.register(Invoice)
admin.site.register(Installment)