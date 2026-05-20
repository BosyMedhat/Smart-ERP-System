from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import AuditLog
from inventory.permissions import IsManager


class AuditLogListView(APIView):
    """
    GET /api/audit/
    فلاتر: user_id, action, model_name, date_from, date_to
    للمدير فقط
    """
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated, IsManager]

    def get(self, request):
        qs = AuditLog.objects.select_related('user').order_by('-created_at')

        # فلاتر
        user_id    = request.query_params.get('user_id')
        action     = request.query_params.get('action')
        model_name = request.query_params.get('model_name')
        date_from  = request.query_params.get('date_from')
        date_to    = request.query_params.get('date_to')
        search     = request.query_params.get('search')

        if user_id:
            qs = qs.filter(user_id=user_id)
        if action:
            qs = qs.filter(action=action)
        if model_name:
            qs = qs.filter(model_name=model_name)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if search:
            qs = qs.filter(
                Q(object_repr__icontains=search) |
                Q(user__username__icontains=search)
            )

        # Pagination بسيط
        page      = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        total     = qs.count()
        start     = (page - 1) * page_size
        end       = start + page_size
        qs        = qs[start:end]

        data = []
        for log in qs:
            data.append({
                'id':          log.pk,
                'user':        log.user.username if log.user else 'النظام',
                'action':      log.action,
                'action_display': log.get_action_display(),
                'model_name':  log.model_name,
                'object_id':   log.object_id,
                'object_repr': log.object_repr,
                'changes':     log.changes,
                'ip_address':  log.ip_address,
                'extra_data':  log.extra_data,
                'created_at':  log.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            })

        return Response({
            'count':     total,
            'page':      page,
            'page_size': page_size,
            'results':   data,
        })
