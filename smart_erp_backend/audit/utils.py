from .models import AuditLog


def log_action(
    user=None,
    action='VIEW',
    model_name='',
    object_id=None,
    object_repr='',
    changes=None,
    ip_address=None,
    extra_data=None,
):
    """
    دالة مساعدة مركزية لتسجيل كل العمليات
    استخدامها: log_action(user=request.user, action='CREATE', ...)
    """
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=object_id,
            object_repr=str(object_repr)[:500],
            changes=changes or {},
            ip_address=ip_address,
            extra_data=extra_data or {},
        )
    except Exception:
        # لا نوقف النظام بسبب فشل الـ logging
        pass


def get_client_ip(request):
    """استخراج IP العميل"""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
