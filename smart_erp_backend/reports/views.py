"""
Reports Module for Smart ERP System
Provides Sales, Inventory, and Financial reports with PDF export
"""

from django.http import HttpResponse, JsonResponse
from django.db.models import Sum, Count, F, FloatField, Q, DecimalField
from django.db.models.functions import TruncDate, Cast
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, timedelta
from decimal import Decimal

# ReportLab imports for PDF generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

# Arabic text handling
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_SUPPORT = True
except ImportError:
    ARABIC_SUPPORT = False

from inventory.models import Sale, SaleItem, Product, StoreSettings


def reshape_arabic(text):
    """Reshape Arabic text for PDF rendering"""
    if not ARABIC_SUPPORT or not text:
        return str(text) if text else ""
    try:
        reshaped = arabic_reshaper.reshape(str(text))
        return get_display(reshaped)
    except:
        return str(text)


def add_cors_headers(response):
    """Add CORS headers to PDF responses"""
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
    return response


class SalesReportView(APIView):
    """
    Sales Report API
    GET /api/reports/sales/?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        if not from_date or not to_date:
            return Response(
                {'error': 'from_date and to_date are required (YYYY-MM-DD)'},
                status=400
            )

        try:
            from_dt = datetime.strptime(from_date, '%Y-%m-%d').date()
            to_dt = datetime.strptime(to_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=400
            )

        # Filter sales by date range
        sales = Sale.objects.filter(
            created_at__date__gte=from_dt,
            created_at__date__lte=to_dt
        )

        # Summary calculations
        total_invoices = sales.count()
        total_revenue = sales.aggregate(
            total=Sum('final_amount')
        )['total'] or Decimal('0')
        total_discount = sales.aggregate(
            total=Sum('discount')
        )['total'] or Decimal('0')
        total_tax = sales.aggregate(
            total=Sum('tax_amount')
        )['total'] or Decimal('0')
        net_revenue = total_revenue - total_discount - total_tax

        # Cash vs Credit revenue
        cash_revenue = sales.filter(
            payment_type='cash'
        ).aggregate(total=Sum('final_amount'))['total'] or Decimal('0')
        credit_revenue = sales.filter(
            payment_type='credit'
        ).aggregate(total=Sum('final_amount'))['total'] or Decimal('0')

        # Top products
        top_products = SaleItem.objects.filter(
            sale__created_at__date__gte=from_dt,
            sale__created_at__date__lte=to_dt
        ).values('product_name').annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-quantity_sold')[:10]

        # Top cashiers
        top_cashiers = sales.filter(
            cashier__isnull=False
        ).values('cashier__first_name', 'cashier__username').annotate(
            invoices_count=Count('id'),
            revenue=Sum('final_amount')
        ).order_by('-revenue')[:10]

        # Format cashier names
        formatted_cashiers = []
        for c in top_cashiers:
            name = c['cashier__first_name'] or c['cashier__username']
            formatted_cashiers.append({
                'cashier_name': name,
                'invoices_count': c['invoices_count'],
                'revenue': float(c['revenue'])
            })

        # Daily breakdown
        daily_breakdown = sales.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            invoices=Count('id'),
            revenue=Sum('final_amount')
        ).order_by('date')

        formatted_daily = [
            {
                'date': d['date'].strftime('%Y-%m-%d'),
                'invoices': d['invoices'],
                'revenue': float(d['revenue'])
            }
            for d in daily_breakdown
        ]

        return Response({
            'period': {
                'from': from_date,
                'to': to_date
            },
            'total_invoices': total_invoices,
            'total_revenue': float(total_revenue),
            'total_discount': float(total_discount),
            'total_tax': float(total_tax),
            'net_revenue': float(net_revenue),
            'cash_revenue': float(cash_revenue),
            'credit_revenue': float(credit_revenue),
            'top_products': list(top_products),
            'top_cashiers': formatted_cashiers,
            'daily_breakdown': formatted_daily
        })


class InventoryReportView(APIView):
    """
    Inventory Report API
    GET /api/reports/inventory/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import ExpressionWrapper

        # Total products count
        total_products = Product.objects.count()

        # Low stock products
        low_stock = list(Product.objects.filter(
            current_stock__lte=F('min_stock_level')
        ).values('name', 'current_stock', 'min_stock_level').annotate(
            shortage=ExpressionWrapper(
                F('min_stock_level') - F('current_stock'),
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        ))

        # Out of stock products
        out_of_stock = list(Product.objects.filter(
            current_stock=0
        ).values('name', 'retail_price'))

        # Stock value calculation — safe version
        stock_value = Decimal('0')
        try:
            products_qs = Product.objects.values('current_stock', 'retail_price')
            for prod in products_qs:
                stock = Decimal(str(prod['current_stock'] or 0))
                price = Decimal(str(prod['retail_price'] or 0))
                stock_value += stock * price
        except Exception as e:
            print(f"Stock value error: {e}")
            stock_value = Decimal('0')

        # Top selling products
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        sale_items = SaleItem.objects.all()
        if from_date and to_date:
            try:
                from_dt = datetime.strptime(from_date, '%Y-%m-%d').date()
                to_dt = datetime.strptime(to_date, '%Y-%m-%d').date()
                sale_items = sale_items.filter(
                    sale__created_at__date__gte=from_dt,
                    sale__created_at__date__lte=to_dt
                )
            except ValueError:
                pass

        top_selling = list(sale_items.values('product_name').annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-quantity_sold')[:10])

        # Convert Decimal to float for JSON serialization
        for item in top_selling:
            item['quantity_sold'] = int(item['quantity_sold'] or 0)
            item['revenue'] = float(item['revenue'] or 0)

        for item in low_stock:
            item['current_stock'] = float(item['current_stock'] or 0)
            item['min_stock_level'] = float(item['min_stock_level'] or 0)
            item['shortage'] = float(item['shortage'] or 0)

        for item in out_of_stock:
            item['retail_price'] = float(item['retail_price'] or 0)

        return Response({
            'total_products': total_products,
            'low_stock_products': low_stock,
            'out_of_stock': out_of_stock,
            'top_selling_products': top_selling,
            'stock_value': float(stock_value)
        })


class FinancialReportView(APIView):
    """
    Financial Report API
    GET /api/reports/financial/?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        if not from_date or not to_date:
            return Response(
                {'error': 'from_date and to_date are required (YYYY-MM-DD)'},
                status=400
            )

        try:
            from_dt = datetime.strptime(from_date, '%Y-%m-%d').date()
            to_dt = datetime.strptime(to_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=400
            )

        # Filter sales
        sales = Sale.objects.filter(
            created_at__date__gte=from_dt,
            created_at__date__lte=to_dt
        )

        # Revenue calculations
        total_revenue = sales.aggregate(
            total=Sum('final_amount')
        )['total'] or Decimal('0')

        cash_revenue = sales.filter(
            payment_type='cash'
        ).aggregate(total=Sum('final_amount'))['total'] or Decimal('0')

        credit_revenue = sales.filter(
            payment_type='credit'
        ).aggregate(total=Sum('final_amount'))['total'] or Decimal('0')

        total_tax = sales.aggregate(
            total=Sum('tax_amount')
        )['total'] or Decimal('0')

        total_discount = sales.aggregate(
            total=Sum('discount')
        )['total'] or Decimal('0')

        # Net profit estimate
        net_profit = total_revenue - total_discount - total_tax

        # Payment split percentages
        if total_revenue > 0:
            cash_percentage = (cash_revenue / total_revenue) * 100
            credit_percentage = (credit_revenue / total_revenue) * 100
        else:
            cash_percentage = 0
            credit_percentage = 0

        # Daily cash flow
        daily_cash_flow = sales.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            cash_in=Sum('final_amount', filter=Q(payment_type='cash')),
            credit_in=Sum('final_amount', filter=Q(payment_type='credit'))
        ).order_by('date')

        formatted_daily = []
        for d in daily_cash_flow:
            cash_in = d['cash_in'] or Decimal('0')
            credit_in = d['credit_in'] or Decimal('0')
            formatted_daily.append({
                'date': d['date'].strftime('%Y-%m-%d'),
                'cash_in': float(cash_in),
                'credit_in': float(credit_in),
                'total': float(cash_in + credit_in)
            })

        return Response({
            'period': {
                'from': from_date,
                'to': to_date
            },
            'total_revenue': float(total_revenue),
            'cash_revenue': float(cash_revenue),
            'credit_revenue': float(credit_revenue),
            'total_tax_collected': float(total_tax),
            'total_discount_given': float(total_discount),
            'net_profit_estimate': float(net_profit),
            'daily_cash_flow': formatted_daily,
            'payment_split': {
                'cash_percentage': round(float(cash_percentage), 2),
                'credit_percentage': round(float(credit_percentage), 2)
            }
        })


# ==================== PDF EXPORT VIEWS ====================

class SalesReportPDFView(APIView):
    """
    Sales Report PDF Export
    GET /api/reports/sales/pdf/?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        if not from_date or not to_date:
            return Response(
                {'error': 'from_date and to_date are required'},
                status=400
            )

        # Fetch data (reuse the same logic)
        view = SalesReportView()
        view.request = request
        response = view.get(request)

        if isinstance(response, Response) and response.status_code != 200:
            return response

        data = response.data

        # Generate PDF
        return self.generate_pdf(data, from_date, to_date)

    def generate_pdf(self, data, from_date, to_date):
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="sales_report_{from_date}_to_{to_date}.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )

        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=20
        )

        elements.append(Paragraph(reshape_arabic('تقرير المبيعات'), title_style))
        elements.append(Paragraph(
            reshape_arabic(f'الفترة: {from_date} إلى {to_date}'),
            ParagraphStyle('DateStyle', parent=styles['Normal'], alignment=TA_CENTER, fontSize=12)
        ))
        elements.append(Spacer(1, 20))

        # Summary Table
        summary_data = [
            [
                reshape_arabic('إجمالي الفواتير'),
                reshape_arabic('إجمالي الإيرادات'),
                reshape_arabic('الخصومات'),
                reshape_arabic('الصافي')
            ],
            [
                str(data['total_invoices']),
                f"{data['total_revenue']:.2f}",
                f"{data['total_discount']:.2f}",
                f"{data['net_revenue']:.2f}"
            ]
        ]

        summary_table = Table(summary_data, colWidths=[3.5*cm]*4)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Top Products Table
        elements.append(Paragraph(reshape_arabic('أفضل المنتجات مبيعاً'), styles['Heading2']))
        elements.append(Spacer(1, 10))

        products_data = [[
            reshape_arabic('المنتج'),
            reshape_arabic('الكمية المباعة'),
            reshape_arabic('الإيرادات')
        ]]

        for p in data['top_products'][:5]:
            products_data.append([
                reshape_arabic(p['product_name']),
                str(p['quantity_sold']),
                f"{p['revenue']:.2f}"
            ])

        products_table = Table(products_data, colWidths=[7*cm, 4*cm, 4*cm])
        products_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#27ae60')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(products_table)
        elements.append(Spacer(1, 20))

        # Top Cashiers Table
        elements.append(Paragraph(reshape_arabic('أفضل الكاشيرين'), styles['Heading2']))
        elements.append(Spacer(1, 10))

        cashiers_data = [[
            reshape_arabic('الكاشير'),
            reshape_arabic('عدد الفواتير'),
            reshape_arabic('الإيرادات')
        ]]

        for c in data['top_cashiers'][:5]:
            cashiers_data.append([
                reshape_arabic(c['cashier_name']),
                str(c['invoices_count']),
                f"{c['revenue']:.2f}"
            ])

        cashiers_table = Table(cashiers_data, colWidths=[7*cm, 4*cm, 4*cm])
        cashiers_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(cashiers_table)

        doc.build(elements)
        return add_cors_headers(response)

    def options(self, request, *args, **kwargs):
        response = HttpResponse()
        return add_cors_headers(response)


class InventoryReportPDFView(APIView):
    """
    Inventory Report PDF Export
    GET /api/reports/inventory/pdf/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch data
        view = InventoryReportView()
        view.request = request
        response = view.get(request)

        if isinstance(response, Response) and response.status_code != 200:
            return response

        data = response.data

        # Generate PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="inventory_report.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )

        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=20
        )

        elements.append(Paragraph(reshape_arabic('تقرير المخزون'), title_style))
        elements.append(Spacer(1, 20))

        # Summary
        summary_data = [
            [reshape_arabic('إجمالي المنتجات'), str(data['total_products'])],
            [reshape_arabic('قيمة المخزون'), f"{data['stock_value']:.2f}"],
            [reshape_arabic('منتجات منخفضة المخزون'), str(len(data['low_stock_products']))],
            [reshape_arabic('منتجات نفدت من المخزون'), str(len(data['out_of_stock']))]
        ]

        summary_table = Table(summary_data, colWidths=[8*cm, 7*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Low Stock Table
        if data['low_stock_products']:
            elements.append(Paragraph(reshape_arabic('منتجات منخفضة المخزون'), styles['Heading2']))
            elements.append(Spacer(1, 10))

            low_data = [[
                reshape_arabic('المنتج'),
                reshape_arabic('المخزون الحالي'),
                reshape_arabic('الحد الأدنى'),
                reshape_arabic('النقص')
            ]]

            for p in data['low_stock_products'][:10]:
                low_data.append([
                    reshape_arabic(p['name']),
                    str(p['current_stock']),
                    str(p['min_stock_level']),
                    str(p['shortage'])
                ])

            low_table = Table(low_data, colWidths=[5*cm, 3*cm, 3*cm, 3*cm])
            low_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e74c3c')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(low_table)
            elements.append(Spacer(1, 20))

        # Top Selling Products
        if data['top_selling_products']:
            elements.append(Paragraph(reshape_arabic('أفضل المنتجات مبيعاً'), styles['Heading2']))
            elements.append(Spacer(1, 10))

            top_data = [[
                reshape_arabic('المنتج'),
                reshape_arabic('الكمية المباعة'),
                reshape_arabic('الإيرادات')
            ]]

            for p in data['top_selling_products'][:10]:
                top_data.append([
                    reshape_arabic(p['product_name']),
                    str(p['quantity_sold']),
                    f"{p['revenue']:.2f}"
                ])

            top_table = Table(top_data, colWidths=[7*cm, 4*cm, 4*cm])
            top_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#27ae60')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(top_table)

        doc.build(elements)
        return add_cors_headers(response)

    def options(self, request, *args, **kwargs):
        response = HttpResponse()
        return add_cors_headers(response)


class FinancialReportPDFView(APIView):
    """
    Financial Report PDF Export
    GET /api/reports/financial/pdf/?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        if not from_date or not to_date:
            return Response(
                {'error': 'from_date and to_date are required'},
                status=400
            )

        # Fetch data
        view = FinancialReportView()
        view.request = request
        response = view.get(request)

        if isinstance(response, Response) and response.status_code != 200:
            return response

        data = response.data

        # Generate PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="financial_report_{from_date}_to_{to_date}.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )

        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=20
        )

        elements.append(Paragraph(reshape_arabic('التقرير المالي'), title_style))
        elements.append(Paragraph(
            reshape_arabic(f'الفترة: {from_date} إلى {to_date}'),
            ParagraphStyle('DateStyle', parent=styles['Normal'], alignment=TA_CENTER, fontSize=12)
        ))
        elements.append(Spacer(1, 20))

        # Summary Table
        summary_data = [
            [reshape_arabic('البيان'), reshape_arabic('القيمة')],
            [reshape_arabic('إجمالي الإيرادات'), f"{data['total_revenue']:.2f}"],
            [reshape_arabic('إيرادات الكاش'), f"{data['cash_revenue']:.2f}"],
            [reshape_arabic('إيرادات الآجل'), f"{data['credit_revenue']:.2f}"],
            [reshape_arabic('إجمالي الضرائب'), f"{data['total_tax_collected']:.2f}"],
            [reshape_arabic('إجمالي الخصومات'), f"{data['total_discount_given']:.2f}"],
            [reshape_arabic('صافي الربح المقدر'), f"{data['net_profit_estimate']:.2f}"]
        ]

        summary_table = Table(summary_data, colWidths=[8*cm, 7*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#ecf0f1')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Payment Split
        elements.append(Paragraph(reshape_arabic('توزيع طرق الدفع'), styles['Heading2']))
        elements.append(Spacer(1, 10))

        split_data = [
            [reshape_arabic('طريقة الدفع'), reshape_arabic('النسبة')],
            [reshape_arabic('كاش'), f"{data['payment_split']['cash_percentage']}%"],
            [reshape_arabic('آجل'), f"{data['payment_split']['credit_percentage']}%"]
        ]

        split_table = Table(split_data, colWidths=[7.5*cm, 7.5*cm])
        split_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8e44ad')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(split_table)
        elements.append(Spacer(1, 20))

        # Daily Cash Flow
        if data['daily_cash_flow']:
            elements.append(Paragraph(reshape_arabic('التدفق النقدي اليومي'), styles['Heading2']))
            elements.append(Spacer(1, 10))

            flow_data = [[
                reshape_arabic('التاريخ'),
                reshape_arabic('الكاش'),
                reshape_arabic('الآجل'),
                reshape_arabic('الإجمالي')
            ]]

            for d in data['daily_cash_flow']:
                flow_data.append([
                    d['date'],
                    f"{d['cash_in']:.2f}",
                    f"{d['credit_in']:.2f}",
                    f"{d['total']:.2f}"
                ])

            flow_table = Table(flow_data, colWidths=[4*cm, 3.5*cm, 3.5*cm, 3.5*cm])
            flow_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2980b9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            elements.append(flow_table)

        doc.build(elements)
        return add_cors_headers(response)

    def options(self, request, *args, **kwargs):
        response = HttpResponse()
        return add_cors_headers(response)
