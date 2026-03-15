# from rest_framework import serializers
# from .models import Customer

# class CustomerSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Customer
#         fields = '__all__'


# from rest_framework import serializers
# from django.contrib.auth.models import User # استيراد موديل المستخدمين الأساسي
# from .models import Customer

# # السيريالايزر الخاص بالعملاء (كما هو)
# class CustomerSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Customer
#         fields = '__all__'

# # التعديل الجديد: السيريالايزر الخاص بالمستخدمين
# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         # نحدد الحقول التي نحتاجها في صفحة الصلاحيات
#         # كلمة المرور (password) لا تظهر في الـ GET لزيادة الأمان
#         fields = ['id', 'username', 'email', 'first_name', 'last_name']





# from rest_framework import serializers
# from django.contrib.auth.models import User
# from .models import Customer, UserProfile  # استيراد الموديل الجديد

# # السيريالايزر الخاص بالعملاء (كما هو)
# class CustomerSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Customer
#         fields = '__all__'

# # سيريالايزر جديد خاص بالبروفايل (الوظيفة والصلاحيات)
# class UserProfileSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = UserProfile
#         fields = ['role', 'permissions']

# # التعديل النهائي لسيريالايزر المستخدمين
# # class UserSerializer(serializers.ModelSerializer):
# #     # ربط البروفايل بالسيريالايزر الأساسي ليظهر كـ Object فرعي
# #     profile = UserProfileSerializer(read_only=True)

# #     class Meta:
# #         model = User
# #         # أضفنا حقل 'profile' للقائمة ليرسله السيرفر للـ React
# #         fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


# class UserSerializer(serializers.ModelSerializer):
#     profile = UserProfileSerializer(read_only=True)

#     class Meta:
#         model = User
#         # هنكتفي باللي بتبعته فعلاً من الـ React
#         fields = ['id', 'username', 'password', 'profile']
#         extra_kwargs = {
#             'password': {'write_only': True} 
#         }

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Customer
from inventory.models import UserProfile

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'permissions']

class UserSerializer(serializers.ModelSerializer):
    # جعل الـ profile قابل للكتابة عشان الـ PATCH يشتغل
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'profile']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False} 
        }

    # دالة الـ update دي هي اللي هتاخد البيانات من React وتحفظها في الـ UserProfile
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # تحديث بيانات الـ User الأساسية (الاسم مثلاً)
        instance.username = validated_data.get('username', instance.username)
        instance.save()

        # تحديث بيانات الـ Profile (الرول والصلاحيات)
        if profile_data:
            profile = instance.profile
            profile.role = profile_data.get('role', profile.role)
            profile.permissions = profile_data.get('permissions', profile.permissions)
            profile.save()

        return instance

    # دالة الـ create عشان لما تضيفي مستخدم جديد من الـ Modal
    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # تحديث البروفايل اللي اتكريت تلقائياً بـ Signals
        profile = user.profile
        profile.role = profile_data.get('role', 'CASHIER')
        profile.permissions = profile_data.get('permissions', {})
        profile.save()
        
        return user