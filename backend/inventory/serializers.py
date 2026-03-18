from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    # إضافة label لكل حقل عشان يظهر بالعربي في صفحة الباك إيند
    barcode = serializers.CharField(source='sku', label="الباركود")
    currentStock = serializers.IntegerField(source='current_stock', label="الكمية الحالية")
    costPrice = serializers.DecimalField(source='cost_price', max_digits=10, decimal_places=2, label="سعر التكلفة")
    retailPrice = serializers.DecimalField(source='retail_price', max_digits=10, decimal_places=2, label="سعر القطاعي")
    wholesalePrice = serializers.DecimalField(source='wholesale_price', max_digits=10, decimal_places=2, label="سعر الجملة")
    halfWholesalePrice = serializers.DecimalField(source='half_wholesale_price', max_digits=10, decimal_places=2, required=False, label="سعر نصف الجملة")
    minReorderLevel = serializers.IntegerField(source='min_stock_level', label="حد التنبيه")
    
    # الحقول اللي كانت بتظهر إنجليزي رغم إنها مش source
    name = serializers.CharField(label="اسم المنتج")
    category = serializers.CharField(label="التصنيف")
    unit = serializers.CharField(label="الوحدة")
    supplier = serializers.CharField(label="المورد", required=False)
    status = serializers.CharField(label="الحالة")

    class Meta:
        model = Product
        fields = [
            'id', 'barcode', 'name', 'category', 'unit', 'supplier',
            'currentStock', 'costPrice', 'retailPrice', 'wholesalePrice', 
            'halfWholesalePrice', 'minReorderLevel', 'status'
        ]
