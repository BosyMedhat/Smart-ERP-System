
from rest_framework import viewsets # السطر اللي كان ناقص

# hena pa3d el pynazem 7arakt el morror  

# 1. بنستورد الـ "قالب" الجاهز اللي بيعمل كل العمليات (عرض، إضافة، حذف، تعديل)
from rest_framework import serializers

# 2. بنستورد الموديل (الجدول) عشان الـ View يعرف هيشتغل على بيانات مين
from .models import Customer

# 3. بنستورد المترجم (Serializer) عشان الـ View يعرف هيحول البيانات لمين
from .serializers import CustomerSerializer

# 4. بناء الكلاس (المدير)
class CustomerViewSet(viewsets.ModelViewSet):
    # بنقول للمدير: "دي البيانات اللي هتشتغل عليها" (كل العملاء)
    queryset = Customer.objects.all()
    
    # بنقول للمدير: "وده المترجم اللي هيساعدك تحول البيانات لـ JSON"
    serializer_class = CustomerSerializer 

