from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
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

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def collect(self, request, pk=None):
        customer = self.get_object()
        amount = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'error': 'المبلغ يجب أن يكون أكبر من صفر'}, status=400)
        new_balance = max(0, float(customer.balance) - amount)
        customer.balance = new_balance
        customer.save()
        return Response({'success': True, 'balance': customer.balance})

    @action(detail=False, methods=['get'])
    def debtors(self, request):
        from django.db.models import Sum, Q, Value, F, DecimalField
        from django.db.models.functions import Coalesce

        # DASH-DEBTORS-001: include both credit balance and unpaid installment debt
        # Customer.balance tracks credit (آجل) sales only.
        # Installments have their own remaining_amount; we aggregate it per customer.
        debtors = Customer.objects.annotate(
            installment_debt=Coalesce(
                Sum(
                    'sale__installments__remaining_amount',
                    filter=Q(sale__installments__is_paid=False),
                ),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        ).annotate(
            total_debt=F('balance') + F('installment_debt')
        ).filter(
            Q(balance__gt=0) | Q(installment_debt__gt=0)
        ).order_by('-total_debt')

        serializer = self.get_serializer(debtors, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='search')
    def search_by_phone(self, request):
        phone = request.query_params.get('phone', '').strip()
        if not phone or len(phone) < 3:
            return Response(
                {'error': 'أدخل على الأقل 3 أرقام للبحث'},
                status=status.HTTP_400_BAD_REQUEST
            )
        customers = Customer.objects.filter(
            phone__icontains=phone
        ).values('id', 'name', 'phone', 'email')[:10]
        return Response(list(customers))

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

    # Brute-force check: look up user object first to check lock state
    user_obj = User.objects.filter(username=username).first()
    if user_obj:
        from django.utils import timezone
        try:
            profile = user_obj.userprofile
            if profile.locked_until and profile.locked_until > timezone.now():
                remaining = int(
                    (profile.locked_until - timezone.now()).total_seconds() / 60
                )
                return Response(
                    {'error': f'الحساب محظور. حاول بعد {remaining} دقيقة'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass

    user = authenticate(username=username, password=password)
    if user:
        # Reset login attempts on success
        try:
            profile = user.userprofile
            if profile.login_attempts > 0 or profile.locked_until:
                profile.login_attempts = 0
                profile.locked_until = None
                profile.save(update_fields=['login_attempts', 'locked_until'])
        except Exception:
            pass

        token, _ = Token.objects.get_or_create(user=user)
        try:
            profile = user.userprofile
            role = profile.role
            permissions = profile.permissions
        except:
            role = 'كاشير'
            permissions = {}
        # تسجيل عملية الدخول في Audit Log
        from audit.utils import log_action, get_client_ip
        log_action(
            user=user,
            action='LOGIN',
            model_name='User',
            object_id=user.id,
            object_repr=f'{user.username} — {role}',
            ip_address=get_client_ip(request),
            extra_data={'role': role},
        )

        # Build permissions list for RBAC (Phase 4)
        from accounts.permissions import resolve_user_permissions
        permissions_set = resolve_user_permissions(user)
        permissions_list = sorted(list(permissions_set))

        # Get role info (FK-based, Phase 3 bridge)
        role_info = None
        try:
            role_obj = user.userprofile.role_new
            if role_obj:
                role_info = {
                    'id':    role_obj.id,
                    'name':  role_obj.name,
                    'level': role_obj.level,
                }
        except Exception:
            pass

        return Response({
            'token': token.key,
            'id': user.id,
            'username': user.username,
            'role': role,
            'permissions': permissions,
            'permission_list': permissions_list,
            'role_obj':        role_info,
        })
    # Increment login attempts on failure
    if user_obj:
        try:
            from django.utils import timezone
            from datetime import timedelta
            profile = user_obj.userprofile
            profile.login_attempts += 1

            try:
                from inventory.models import StoreSettings
                settings_obj = StoreSettings.objects.first()
                max_attempts = settings_obj.max_login_attempts if settings_obj else 5
                lockout_minutes = settings_obj.lockout_duration_minutes if settings_obj else 30
            except Exception:
                max_attempts = 5
                lockout_minutes = 30

            if profile.login_attempts >= max_attempts:
                profile.locked_until = timezone.now() + timedelta(minutes=lockout_minutes)
                profile.login_attempts = 0
                profile.save(update_fields=['login_attempts', 'locked_until'])
                return Response(
                    {'error': f'تم تجاوز الحد المسموح. الحساب محظور لـ {lockout_minutes} دقيقة'},
                    status=status.HTTP_403_FORBIDDEN
                )
            profile.save(update_fields=['login_attempts'])
        except Exception:
            pass

    return Response(
        {'error': 'بيانات الدخول غير صحيحة'},
        status=status.HTTP_401_UNAUTHORIZED
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # تسجيل عملية الخروج في Audit Log
    from audit.utils import log_action, get_client_ip
    log_action(
        user=request.user,
        action='LOGOUT',
        model_name='User',
        object_id=request.user.id,
        object_repr=request.user.username,
        ip_address=get_client_ip(request),
    )
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'تم تسجيل الخروج بنجاح'})