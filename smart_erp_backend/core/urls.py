from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter # 1. استيراد الـ Router
from inventory.views import ProductViewSet
from customers.views import CustomerViewSet

# 2. إنشاء كائن الـ router  
# da ele py5le django ypne wagha rosmya 3ashan  agrap menha el urls peshola 
router = DefaultRouter()

# 3. تسجيل الـ ViewSets في الـ router
#  hena pakol ay 7ad ytlop rapt el product ep3to le ProductViewSet
router.register(r'products', ProductViewSet)

router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    #  hena ana damagat kol el urls ele fe el rotuter gwa el api/ 3ashan t3raf tektep api/kza kaz
    # بدل ما تكتب رابط يدوي لكل عملية (رابط للمسح، رابط للإضافة، رابط للتعديل)، الـ 
    # DefaultRouter بيعمل كل ده في سطر واحد
    path('api/', include(router.urls)),
]



# "خريطة الطرق". بيحدد الـ Links اللي بنستخدمها في المتصفح أو البوستمان.


# #ملخص الرحلة (عشان المناقشة):
# لما الدكتور يسألك "الـ API ده شغال إزاي؟"، ردك المختصر والسريع يكون:

# الطلب (Request): جيه للرابط المعرف في الـ urls.py.

# التوجيه: الـ URL وجه الطلب للـ view.

# التحويل: الـ view جاب البيانات من الـ model ومررها للـ serializer.

# الرد (Response): الـ serializer حولها لـ JSON وبعتها للمتصفح.