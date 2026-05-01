from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum
from .models import Attendance, PayrollRun, SalarySlip
from .serializers import (AttendanceSerializer,
                           PayrollRunSerializer,
                           SalarySlipSerializer)
from inventory.models import Employee


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related(
        'employee', 'recorded_by').all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get('employee')
        date = self.request.query_params.get('date')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if date:
            qs = qs.filter(date=date)
        if month and year:
            qs = qs.filter(date__month=month, date__year=year)
        return qs

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['get'],
            url_path='summary/(?P<employee_id>[0-9]+)')
    def employee_summary(self, request, employee_id=None):
        """ملخص حضور موظف في شهر معين"""
        month = request.query_params.get('month',
                                         timezone.now().month)
        year = request.query_params.get('year',
                                         timezone.now().year)
        records = Attendance.objects.filter(
            employee_id=employee_id,
            date__month=month,
            date__year=year
        )
        summary = {
            'employee_id': employee_id,
            'month': month,
            'year': year,
            'total_days': records.count(),
            'present': records.filter(status='present').count(),
            'absent': records.filter(status='absent').count(),
            'late': records.filter(status='late').count(),
            'excused': records.filter(status='excused').count(),
            'total_late_minutes': records.aggregate(
                total=Sum('late_minutes'))['total'] or 0,
        }
        return Response(summary)

    @action(detail=False, methods=['post'], url_path='bulk-record')
    def bulk_record(self, request):
        """تسجيل حضور جميع الموظفين دفعة واحدة"""
        date = request.data.get('date',
                                 timezone.now().date().isoformat())
        default_status = request.data.get('status', 'present')
        employees = Employee.objects.filter()
        created_count = 0
        for emp in employees:
            obj, created = Attendance.objects.get_or_create(
                employee=emp,
                date=date,
                defaults={
                    'status': default_status,
                    'recorded_by': request.user
                }
            )
            if created:
                created_count += 1
        return Response({
            'message': f'تم تسجيل {created_count} موظف',
            'date': date,
            'status': default_status
        })


class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.prefetch_related('slips').all()
    serializer_class = PayrollRunSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='generate-slips')
    def generate_slips(self, request, pk=None):
        """توليد قسائم الرواتب تلقائياً من بيانات الموظفين والحضور"""
        payroll = self.get_object()
        if payroll.status != 'draft':
            return Response(
                {'error': 'يمكن توليد الرواتب للمسيرات في حالة مسودة فقط'},
                status=status.HTTP_400_BAD_REQUEST
            )
        employees = Employee.objects.all()
        slips_created = 0
        total_gross = 0
        total_deductions = 0

        for emp in employees:
            attendance = Attendance.objects.filter(
                employee=emp,
                date__month=payroll.month,
                date__year=payroll.year
            )
            absent_days = attendance.filter(
                status='absent').count()
            total_late = attendance.aggregate(
                t=Sum('late_minutes'))['t'] or 0

            daily_rate = emp.baseSalary / 26
            absence_deduction = absent_days * daily_rate
            late_deduction = (total_late / 60) * (daily_rate / 8)

            net = (emp.baseSalary + emp.incentives
                   - emp.advances - absence_deduction
                   - late_deduction)

            slip, created = SalarySlip.objects.get_or_create(
                payroll_run=payroll,
                employee=emp,
                defaults={
                    'base_salary': emp.baseSalary,
                    'incentives': emp.incentives,
                    'advances': emp.advances,
                    'deductions': 0,
                    'absent_days': absent_days,
                    'late_deduction': round(late_deduction, 2),
                    'net_salary': round(net, 2),
                }
            )
            if created:
                slips_created += 1
                total_gross += emp.baseSalary + emp.incentives
                total_deductions += (emp.advances + absence_deduction
                                     + late_deduction)

        payroll.total_gross = round(total_gross, 2)
        payroll.total_deductions = round(total_deductions, 2)
        payroll.total_net = round(total_gross - total_deductions, 2)
        payroll.save()

        return Response({
            'message': f'تم توليد {slips_created} قسيمة راتب',
            'total_gross': payroll.total_gross,
            'total_net': payroll.total_net,
        })

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'draft':
            return Response({'error': 'المسير ليس في حالة مسودة'},
                            status=status.HTTP_400_BAD_REQUEST)
        payroll.status = 'approved'
        payroll.approved_by = request.user
        payroll.save()
        return Response({'message': 'تم اعتماد مسير الرواتب',
                         'status': 'approved'})

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'approved':
            return Response({'error': 'يجب اعتماد المسير أولاً'},
                            status=status.HTTP_400_BAD_REQUEST)
        payroll.status = 'paid'
        payroll.paid_at = timezone.now()
        payroll.slips.update(is_paid=True, paid_at=timezone.now())
        payroll.save()
        return Response({'message': 'تم تسجيل صرف الرواتب',
                         'status': 'paid'})


class SalarySlipViewSet(viewsets.ModelViewSet):
    queryset = SalarySlip.objects.select_related(
        'employee', 'payroll_run').all()
    serializer_class = SalarySlipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get('employee')
        payroll_id = self.request.query_params.get('payroll_run')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if payroll_id:
            qs = qs.filter(payroll_run_id=payroll_id)
        return qs
