# # from rest_framework import viewsets, status
# # from rest_framework.response import Response
# # from rest_framework.decorators import api_view, permission_classes
# # from rest_framework.permissions import AllowAny
# # from django.contrib.auth import authenticate
# # from django.contrib.auth.models import User
# # from django.db import transaction
# # from .models import Customer, UserProfile
# # from .serializers import CustomerSerializer, UserSerializer

# # # 1. مدير العملاء
# # class CustomerViewSet(viewsets.ModelViewSet):
# #     queryset = Customer.objects.all()
# #     serializer_class = CustomerSerializer



# # # 2. مدير المستخدمين
# # class UserViewSet(viewsets.ModelViewSet):
# #     queryset = User.objects.all()
# #     serializer_class = UserSerializer

# #     # هذه الدالة يجب أن تكون داخل الـ class (تأكد من وجود مسافة بادئة/Indentation صحيحة)
# #     def create(self, request, *args, **kwargs):
# #         data = request.data
# #         username = data.get('username')
# #         password = data.get('password')
# #         role = data.get('role', 'كاشير')

# #         if not username or not password:
# #             return Response({"error": "الاسم والباسورد مطلوبين"}, status=status.HTTP_400_BAD_REQUEST)

# #         if User.objects.filter(username=username).exists():
# #             return Response({"error": "اسم المستخدم موجود مسبقاً"}, status=status.HTTP_400_BAD_REQUEST)

# #         try:
# #             with transaction.atomic():
# #                 user = User.objects.create_user(username=username, password=password)
# #                 UserProfile.objects.create(user=user, role=role, permissions={})
# #                 serializer = self.get_serializer(user)
# #                 return Response(serializer.data, status=status.HTTP_201_CREATED)
# #         except Exception as e:
# #             return Response({"error": f"حدث خطأ: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

# # # 3. دالة تسجيل الدخول (خارج الـ UserViewSet وفي مستوى الملف)
# # @api_view(['POST'])
# # @permission_classes([AllowAny])
# # def login_view(request):
# #     username = request.data.get('username')
# #     password = request.data.get('password')

# #     if not username or not password:
# #         return Response({"error": "يرجى إدخال اسم المستخدم وكلمة المرور"}, status=status.HTTP_400_BAD_REQUEST)

# #     user = authenticate(username=username, password=password)

# #     if user is not None:
# #         try:
# #             # التأكد من وجود البروفايل
# #             profile = user.profile  
# #             return Response({
# #                 "username": user.username,
# #                 "role": profile.role,
# #                 "permissions": profile.permissions,
# #                 "message": "تم الدخول بنجاح"
# #             }, status=status.HTTP_200_OK)
# #         except UserProfile.DoesNotExist:
# #             return Response({"error": "المستخدم موجود ولكن لا يوجد بروفايل"}, status=status.HTTP_400_BAD_REQUEST)
# #     else:
# #         return Response({"error": "اسم المستخدم أو كلمة المرور غير صحيحة"}, status=status.HTTP_401_UNAUTHORIZED)







# from rest_framework import viewsets, status
# from rest_framework.response import Response
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from django.contrib.auth import authenticate
# from django.contrib.auth.models import User
# from django.db import transaction
# from .models import Customer, UserProfile
# from .serializers import CustomerSerializer, UserSerializer

# class CustomerViewSet(viewsets.ModelViewSet):
#     queryset = Customer.objects.all()
#     serializer_class = CustomerSerializer

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer

#     # جلب جميع المستخدمين مع بيانات البروفايل
#     def list(self, request, *args, **kwargs):
#         users = User.objects.all()
#         results = []
#         for user in users:
#             try:
#                 profile = user.profile
#                 results.append({
#                     "id": user.id,
#                     "username": user.username,
#                     "role": profile.role,
#                     "permissions": profile.permissions
#                 })
#             except UserProfile.DoesNotExist:
#                 results.append({"id": user.id, "username": user.username, "role": "لا يوجد", "permissions": {}})
#         return Response(results)

#     # إنشاء مستخدم مع حفظ الدور
#     def create(self, request, *args, **kwargs):
#         data = request.data
#         username = data.get('username')
#         password = data.get('password')
#         role = data.get('role', 'كاشير')

#         if not username or not password:
#             return Response({"error": "الاسم والباسورد مطلوبين"}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             with transaction.atomic():
#                 user = User.objects.create_user(username=username, password=password)
#                 profile = UserProfile.objects.create(user=user, role=role, permissions={})
#                 return Response({
#                     "id": user.id, "username": user.username, "role": profile.role, "permissions": profile.permissions
#                 }, status=status.HTTP_201_CREATED)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#     # تحديث الصلاحيات
#     # def partial_update(self, request, *args, **kwargs):
#     #     user = self.get_object()
#     #     data = request.data
#     #     try:
#     #         profile = user.profile
#     #         if 'role' in data: profile.role = data['role']
#     #         if 'permissions' in data: profile.permissions = data['permissions']
#     #         profile.save()
#     #         return Response({"message": "تم التحديث بنجاح"})
#     #     except UserProfile.DoesNotExist:
#     #         return Response({"error": "بروفايل غير موجود"}, status=status.HTTP_404_NOT_FOUND)




# def partial_update(self, request, *args, **kwargs):
#         user = self.get_object()
#         data = request.data
#         try:
#             profile = user.profile
#             # تحديث الدور إذا تم إرساله
#             if 'role' in data: 
#                 profile.role = data['role']
#             # تحديث الصلاحيات
#             if 'permissions' in data: 
#                 profile.permissions = data['permissions']
#             profile.save()
#             return Response({"message": "تم التحديث بنجاح"})
#         except UserProfile.DoesNotExist:
#             return Response({"error": "البروفايل غير موجود"}, status=404)
# @api_view(['POST'])
# @permission_classes([AllowAny])
# def login_view(request):
#     username = request.data.get('username')
#     password = request.data.get('password')
#     user = authenticate(username=username, password=password)

#     if user:
#         try:
#             profile = user.profile
#             return Response({
#                 "username": user.username,
#                 "role": profile.role,
#                 "permissions": profile.permissions
#             })
#         except UserProfile.DoesNotExist:
#             return Response({"error": "لا يوجد بروفايل"}, status=400)
#     return Response({"error": "بيانات الدخول خاطئة"}, status=401)






# from rest_framework import viewsets, status
# from rest_framework.response import Response
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from django.contrib.auth import authenticate
# from django.contrib.auth.models import User
# from django.db import transaction
# from .models import Customer, UserProfile
# from .serializers import CustomerSerializer, UserSerializer

# class CustomerViewSet(viewsets.ModelViewSet):
#     queryset = Customer.objects.all()
#     serializer_class = CustomerSerializer

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer

#     def list(self, request, *args, **kwargs):
#         users = User.objects.all()
#         results = []
#         for user in users:
#             try:
#                 profile = user.profile
#                 results.append({
#                     "id": user.id,
#                     "username": user.username,
#                     "role": profile.role,
#                     "permissions": profile.permissions
#                 })
#             except UserProfile.DoesNotExist:
#                 results.append({"id": user.id, "username": user.username, "role": "لا يوجد", "permissions": {}})
#         return Response(results)

#     def create(self, request, *args, **kwargs):
#         data = request.data
#         username = data.get('username')
#         password = data.get('password')
#         role = data.get('role', 'كاشير')

#         if not username or not password:
#             return Response({"error": "الاسم والباسورد مطلوبين"}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             with transaction.atomic():
#                 user = User.objects.create_user(username=username, password=password)
#                 profile = UserProfile.objects.create(user=user, role=role, permissions={})
#                 return Response({
#                     "id": user.id, "username": user.username, "role": profile.role, "permissions": profile.permissions
#                 }, status=status.HTTP_201_CREATED)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#     # تم نقل دالة partial_update إلى داخل الكلاس هنا بشكل صحيح
#     def partial_update(self, request, *args, **kwargs):
#         user = self.get_object()
#         data = request.data
#         try:
#             profile = user.profile
#             if 'role' in data: 
#                 profile.role = data['role']
#             if 'permissions' in data: 
#                 profile.permissions = data['permissions']
#             profile.save()
#             return Response({"message": "تم التحديث بنجاح"})
#         except UserProfile.DoesNotExist:
#             return Response({"error": "البروفايل غير موجود"}, status=status.HTTP_404_NOT_FOUND)

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def login_view(request):
#     username = request.data.get('username')
#     password = request.data.get('password')
#     user = authenticate(username=username, password=password)

#     if user:
#         try:
#             profile = user.profile
#             return Response({
#                 "username": user.username,
#                 "role": profile.role,
#                 "permissions": profile.permissions
#             })
#         except UserProfile.DoesNotExist:
#             return Response({"error": "لا يوجد بروفايل"}, status=status.HTTP_400_BAD_REQUEST)
#     return Response({"error": "بيانات الدخول خاطئة"}, status=status.HTTP_401_UNAUTHORIZED)









from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from .models import Customer
from inventory.models import UserProfile
from .serializers import CustomerSerializer, UserSerializer

# 1. مدير العملاء
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

# 2. مدير المستخدمين مع معالجة الصلاحيات
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # الـ ModelViewSet لوحدها بتهندل الـ list والـ create والـ update
    # إحنا بس هنخليها تستخدم الـ Serializer اللي كتبناه عشان يقرأ الـ profile
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
                # إنشاء أو جلب اليوزر
                user, created = User.objects.get_or_create(username=username)
                if created:
                    user.set_password(password)
                    user.save()
                
                # استخدام get_or_create للبروفايل عشان يمنع خطأ الـ UNIQUE
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

    


# تحديث جزئي (يستخدم عند تغيير الصلاحيات من الواجهة)
    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        data = request.data
        try:
            # الوصول للبروفايل (تأكدي أن المسمى هو profile أو userprofile حسب الموديل)
            profile = user.profile 
            
            if 'role' in data: 
                profile.role = data['role']

            # 👇 التعديل السحري هنا: بيشوف لو الصلاحيات جاية جوه profile أو مباشرة
            permissions_to_save = data.get('permissions')
            if not permissions_to_save and 'profile' in data:
                permissions_to_save = data['profile'].get('permissions')

            if permissions_to_save is not None:
                profile.permissions = permissions_to_save
                profile.save() # الحفظ الفعلي
                return Response({"message": "تم حفظ الصلاحيات بنجاح ✅", "permissions": profile.permissions})
            
            profile.save()
            return Response({"message": "تم التحديث بنجاح"})
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 3. دالة تسجيل الدخول
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if user:
        try:
            profile = user.profile
            return Response({
                "id": user.id,
                "username": user.username,
                "role": profile.role,
                "permissions": profile.permissions
            })

        except UserProfile.DoesNotExist:
            return Response({"error": "لا يوجد بروفايل"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"error": "بيانات الدخول خاطئة"}, status=status.HTTP_401_UNAUTHORIZED)