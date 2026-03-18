from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # نستخدم أسماء الحقول كما هي في models.py (بالشرطة السفلية)
    list_display = ('name', 'sku', 'current_stock', 'retail_price')
    search_fields = ('name', 'sku')
