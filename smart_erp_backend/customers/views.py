from rest_framework import viewsets, status # استيراد مكتبات بناء الواجهات وحالة الاستجابة
from rest_framework.response import Response # استيراد مكتبة الردود للـ API
from rest_framework.decorators import api_view, permission_classes # استيراد الديكورات لتحديد طرق العرض والصلاحيات
from rest_framework.permissions import AllowAny # استيراد صلاحية السماح للجميع
from rest_framework.authtoken.models import Token # استيراد موديل التوكن الخاص بالمصادقة
from django.contrib.auth import authenticate # استيراد دالة التحقق من صحة المستخدم
from django.contrib.auth.models import User # استيراد موديل المستخدم الافتراضي
from django.db import transaction # استيراد مكتبة المعاملات لقاعدة البيانات
from .models import Customer # استيراد موديل العميل
from accounts.models import UserProfile # استيراد موديل الملف الشخصي
from .serializers import CustomerSerializer, UserSerializer # استيراد مسلسلات البيانات

# 1. مدير العملاء
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

# 2. مدير المستخدمين مع معالجة الصلاحيات
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.select_related('profile').all()
    
    def create(self, request, *args, **kwargs):
        data = request.data
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'كاشير')

        if not username or not password:
            return Response({"error": "الاسم والباسورد مطلوبين"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user, created = User.objects.get_or_create(username=username)
                if created:
                    user.set_password(password)
                    user.save()
                
                profile, p_created = UserProfile.objects.get_or_create(user=user)
                profile.role = role
                profile.permissions = {}
                profile.save()

                return Response({
                    "id": user.id, 
                    "username": user.username, 
                    "role": profile.role, 
                    "permissions": profile.permissions
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        data = request.data
        try:
            profile = user.profile 
            
            if 'role' in data: 
                profile.role = data['role']

            permissions_to_save = data.get('permissions')
            if not permissions_to_save and 'profile' in data:
                permissions_to_save = data['profile'].get('permissions')

            if permissions_to_save is not None:
                profile.permissions = permissions_to_save
                profile.save()
                return Response({"message": "تم حفظ الصلاحيات بنجاح ✅", "permissions": profile.permissions})
            
            profile.save()
            return Response({"message": "تم التحديث بنجاح"})
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 3. دالة تسجيل الدخول (API Endpoint)
@api_view(['POST']) # السماح بطلبات POST فقط
@permission_classes([AllowAny]) # السماح بأي مستخدم للوصول للصلاحية
def login_view(request): # تعريف دالة تسجيل الدخول
    username = request.data.get('username') # استخراج اسم المستخدم من الطلب
    password = request.data.get('password') # استخراج كلمة المرور من الطلب
    user = authenticate(username=username, password=password) # محاولة مصادقة المستخدم

    if user: # إذا تمت المصادقة بنجاح
        role = 'كاشير' # تعيين الدور الافتراضي كـ كاشير
        permissions = {} # تعيين الصلاحيات المبدئية كفارغة

        if hasattr(user, 'profile'): # التحقق مما إذا كان للمستخدم ملف شخصي
            role = user.profile.role # أخذ الدور من الملف الشخصي
            permissions = user.profile.permissions # أخذ الصلاحيات من الملف الشخصي
        
        # استخراج صلاحيات جانجو المترجمة من واجهة الأدمن
        django_perms = [perm.split('.')[-1] for perm in user.get_all_permissions()] # معالجة وتحويل الصلاحيات الافتراضية

        token, _ = Token.objects.get_or_create(user=user) # جلب أو إنشاء توكن جديد للمستخدم

        return Response({ # إرسال البيانات والتوكن إلى الواجهة الأمامية
            "id": user.id, # إرسال الـ ID
            "username": user.username, # إرسال اسم المستخدم
            "role": role, # إرسال الدور
            "permissions": permissions, # إرسال الصلاحيات المخصصة
            "django_permissions": django_perms, # إرسال صلاحيات جانغو
            "is_superuser": user.is_superuser, # إرسال حالة السوبر يوزر
            "token": token.key, # إرسال التوكن لربطه مع API أخرى
        })

    return Response({"error": "بيانات الدخول خاطئة"}, status=status.HTTP_401_UNAUTHORIZED) # إرسال رسالة خطأ في حال الفشل