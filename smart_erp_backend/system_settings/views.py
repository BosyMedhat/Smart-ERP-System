from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SystemConfiguration
from .serializers import SystemConfigurationSerializer
# استيراد call_command لعمل النسخة الاحتياطية
from django.core.management import call_command
from datetime import datetime
import os

class SystemConfigViewSet(viewsets.ModelViewSet):
    queryset = SystemConfiguration.objects.all().order_by("-id") 
    serializer_class = SystemConfigurationSerializer

    # ✅ إضافة الأكشن الخاص بالنسخ الاحتياطي
    @action(detail=False, methods=['post'], url_path='backup-server')
    def backup_server(self, request):
        try:
            # مسار حفظ النسخة (تأكدي أن المجلد موجود)
            backup_dir = os.path.join(os.getcwd(), 'backups')
            if not os.path.exists(backup_dir):
                os.makedirs(backup_dir)

            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            filename = f'backup_{timestamp}.json'
            filepath = os.path.join(backup_dir, filename)

            # تنفيذ أمر النسخ الاحتياطي
            with open(filepath, 'w', encoding='utf-8') as f:
                call_command('dumpdata', indent=2, stdout=f)

            return Response({
                'status': 'success',
                'filename': filename,
                'message': 'تم إنشاء النسخة الاحتياطية بنجاح'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)