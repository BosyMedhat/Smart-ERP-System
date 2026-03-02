from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter 
# من فضلك لاحظي: عملنا تعليق (Comment) للسطور اللي بتسبب خطأ حالياً
# from inventory.views import ProductViewSet
# from customers.views import CustomerViewSet
from system_settings.views import SystemConfigViewSet
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()

# بنوقف تسجيل الـ ViewSets اللي مش موجودة فولدراتها عندك
# router.register(r'products', ProductViewSet)
# router.register(r'customers', CustomerViewSet)

# بنسيب بس الـ SystemConfig عشان ده اللي فيه اللوجو وشغلك
router.register(r'system-config', SystemConfigViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)