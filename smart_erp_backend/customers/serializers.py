



# el malaf da py7wel el py le json 3ashan el react mesh pyfhm python

# 1. بنستورد الأدوات اللي هتساعدنا في عملية التحويل من مكتبة Django REST Framework
from rest_framework import serializers

# 2. بنستورد الموديل (الجدول) اللي عايزين نحول بياناته (العملاء)
from .models import Customer

# 3. بنعمل كلاس (مترجم) خاص بالعملاء
class CustomerSerializer(serializers.ModelSerializer):
    
    # 4. الـ Meta هي "إعدادات" المترجم
    class Meta:
        # بنقوله: استعمل جدول الـ Customer كمرجع ليك
        model = Customer
        # بنقوله: حول "كل" الحقول (الأعمدة) اللي في الجدول لـ JSON
        fields = '__all__'