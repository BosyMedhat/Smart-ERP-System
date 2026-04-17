from rest_framework import serializers, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import SystemSettings

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'

class SystemSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة إعدادات النظام.
    يسمح فقط بسجل واحد (Singleton).
    """
    serializer_class = SystemSettingsSerializer
    queryset = SystemSettings.objects.all()

    def get_object(self):
        return SystemSettings.get_settings()

    def list(self, request, *args, **kwargs):
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # منع إنشاء سجلات إضافية، التحديث فقط
        return self.update(request, *args, **kwargs)
