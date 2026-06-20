from decimal import Decimal
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import TreasuryAccount, TreasuryTransaction
from .serializers import (
    TreasuryAccountSerializer,
    TreasuryTransactionSerializer,
    ManualTransactionSerializer,
)
from .permissions import CanViewTreasury, CanManageTreasuryFull


class TreasuryAccountViewSet(viewsets.ReadOnlyModelViewSet):
    """
    حسابات الخزينة — قراءة فقط
    GET /api/treasury/accounts/
    GET /api/treasury/accounts/{id}/
    """
    queryset               = TreasuryAccount.objects.filter(is_active=True)
    serializer_class       = TreasuryAccountSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated, CanViewTreasury]


class TreasuryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    حركات الخزينة — قراءة + إضافة يدوية
    GET  /api/treasury/transactions/
    GET  /api/treasury/transactions/{id}/
    POST /api/treasury/transactions/manual/
    GET  /api/treasury/transactions/summary/
    """
    serializer_class       = TreasuryTransactionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated, CanViewTreasury]

    def get_queryset(self):
        qs = TreasuryTransaction.objects.select_related(
            'account', 'created_by'
        ).order_by('-created_at')

        account_id = self.request.query_params.get('account')
        if account_id:
            qs = qs.filter(account_id=account_id)

        t_type = self.request.query_params.get('type')
        if t_type:
            qs = qs.filter(transaction_type=t_type)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # ERP-P1-012: Add reference filters for installment payment history
        reference_type = self.request.query_params.get('reference_type')
        if reference_type:
            qs = qs.filter(reference_type=reference_type)

        reference_id = self.request.query_params.get('reference_id')
        if reference_id:
            qs = qs.filter(reference_id=reference_id)

        return qs

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[IsAuthenticated, CanManageTreasuryFull],
        url_path='manual',
    )
    def manual_entry(self, request):
        """
        POST /api/treasury/transactions/manual/
        إضافة حركة يدوية (مصروف عام / تسوية)
        """
        serializer = ManualTransactionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            account = TreasuryAccount.objects.get(pk=data['account_id'], is_active=True)
        except TreasuryAccount.DoesNotExist:
            return Response(
                {'error': 'الحساب غير موجود أو غير نشط'},
                status=status.HTTP_404_NOT_FOUND
            )

        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            acc = TreasuryAccount.objects.select_for_update().get(pk=account.pk)
            amount = Decimal(str(data['amount']))

            if data['transaction_type'] == 'INCOME':
                acc.balance += amount
            elif data['transaction_type'] == 'EXPENSE':
                acc.balance -= amount

            acc.save()

            t = TreasuryTransaction.objects.create(
                account=acc,
                transaction_type=data['transaction_type'],
                category=data['category'],
                amount=amount,
                balance_after=acc.balance,
                description=data['description'],
                reference_type='manual',
                created_by=request.user,
                is_auto=False,
            )

        return Response(
            TreasuryTransactionSerializer(t).data,
            status=status.HTTP_201_CREATED
        )

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated, CanViewTreasury],
        url_path='summary',
    )
    def summary(self, request):
        """
        GET /api/treasury/transactions/summary/
        ملخص مالي شامل للـ Dashboard
        """
        today = timezone.now().date()

        accounts = TreasuryAccount.objects.filter(is_active=True)
        total_balance = accounts.aggregate(
            total=Sum('balance')
        )['total'] or Decimal('0')

        today_income = TreasuryTransaction.objects.filter(
            transaction_type='INCOME',
            created_at__date=today,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        today_expense = TreasuryTransaction.objects.filter(
            transaction_type='EXPENSE',
            created_at__date=today,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        month_income = TreasuryTransaction.objects.filter(
            transaction_type='INCOME',
            created_at__month=today.month,
            created_at__year=today.year,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        month_expense = TreasuryTransaction.objects.filter(
            transaction_type='EXPENSE',
            created_at__month=today.month,
            created_at__year=today.year,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        accounts_data = TreasuryAccountSerializer(accounts, many=True).data

        return Response({
            'total_balance':   total_balance,
            'today_income':    today_income,
            'today_expense':   today_expense,
            'today_net':       today_income - today_expense,
            'month_income':    month_income,
            'month_expense':   month_expense,
            'month_net':       month_income - month_expense,
            'accounts':        accounts_data,
        })
