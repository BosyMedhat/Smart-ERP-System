from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Customer
from inventory.models import UserProfile
from .serializers import CustomerSerializer
from inventory.permissions import (
    CanManageProducts,
    CanManageInvoices,
    CanManageEmployees,
    CanManageSuppliers,
    CanViewReports,
    CanManageTreasury,
    CanManageUsers,
    IsManagerOrHasPermission,
    IsManager,
)

# User Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'permissions']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(
        source='userprofile',
        required=False
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email',
                  'first_name', 'last_name', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('userprofile', None)
        # تحديث بيانات الـ User الأساسية
        instance = super().update(instance, validated_data)
        # تحديث الـ Profile
        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(
                user=instance
            )
            if 'role' in profile_data:
                profile.role = profile_data['role']
            if 'permissions' in profile_data:
                profile.permissions = profile_data['permissions']
            profile.save()
        return instance

# مدير العملاء فقط
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsManagerOrHasPermission]

# إدارة المستخدمين — للمدير فقط
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        try:
            profile = user.userprofile
            role = profile.role
            permissions = profile.permissions
        except:
            role = 'كاشير'
            permissions = {}
        return Response({
            'token': token.key,
            'id': user.id,
            'username': user.username,
            'role': role,
            'permissions': permissions
        })
    return Response(
        {'error': 'بيانات الدخول غير صحيحة'},
        status=status.HTTP_401_UNAUTHORIZED
    )