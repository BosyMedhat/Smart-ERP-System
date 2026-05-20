from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import resolve_user_permissions
from accounts.serializers import RoleSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Returns current user info + resolved permissions list.
    Used by frontend to load RBAC state on login.
    """
    user = request.user
    permissions_set = resolve_user_permissions(user)

    role_data = None
    try:
        role = user.userprofile.role_new
        if role:
            role_data = RoleSerializer(role).data
    except Exception:
        pass

    return Response({
        'id':           user.id,
        'username':     user.username,
        'email':        user.email,
        'role':         role_data,
        'permissions':  sorted(list(permissions_set)),
        'is_superuser': user.is_superuser,
    })
