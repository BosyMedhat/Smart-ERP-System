# # from django.urls import path, include
# # from rest_framework.routers import DefaultRouter
# # from .views import CustomerViewSet # تأكدي إن الكلاس ده موجود في views.py هناك

# # router = DefaultRouter()
# # router.register(r'list', CustomerViewSet)

# # urlpatterns = [
# #     path('', include(router.urls)),
# # ]


# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import CustomerViewSet 

# router = DefaultRouter()
# # التعديل هنا: نترك المسار فارغاً ليكون الرابط هو الأساسي
# router.register(r'', CustomerViewSet, basename='customer') 

# urlpatterns = [
#     path('', include(router.urls)),
# ]





# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# # تأكدي من استيراد UserViewSet من ملف views
# from .views import CustomerViewSet, UserViewSet 

# router = DefaultRouter()

# # مسار العملاء (اللي كان موجود أصلاً)
# router.register(r'customers', CustomerViewSet, basename='customer') 

# # التعديل الجديد: إضافة مسار المستخدمين
# router.register(r'users', UserViewSet, basename='user') 

# urlpatterns = [
#     path('', include(router.urls)),
# ]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
# قمت باستيراد login_view بجانب الـ ViewSets
from .views import CustomerViewSet, UserViewSet, login_view 

router = DefaultRouter()

# مسار العملاء
router.register(r'customers', CustomerViewSet, basename='customer') 

# مسار المستخدمين
router.register(r'users', UserViewSet, basename='user') 

urlpatterns = [
    # دمج الـ Router مع مسار الـ login اليدوي
    path('', include(router.urls)),
    path('login/', login_view, name='login'), 
]