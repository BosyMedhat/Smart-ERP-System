from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import RoleBasedPermission
from .models import SystemAnomaly
from .serializers import SystemAnomalySerializer

class SystemAnomalyViewSet(viewsets.ModelViewSet):
    """
    ViewSet لعرض العمليات المشبوهة في النظام.
    ملاحظة: في الإنتاج يفضل قصر الوصول للمدراء فقط.
    """
    queryset = SystemAnomaly.objects.all().order_by('-timestamp')
    serializer_class = SystemAnomalySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
