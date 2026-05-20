from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TreasuryAccountViewSet, TreasuryTransactionViewSet

router = DefaultRouter()
router.register(r'accounts',     TreasuryAccountViewSet,     basename='treasury-accounts')
router.register(r'transactions', TreasuryTransactionViewSet, basename='treasury-transactions')

urlpatterns = [
    path('', include(router.urls)),
]
