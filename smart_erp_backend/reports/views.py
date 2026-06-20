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
from datetime import date, datetime, timedelta
from decimal import Decimal

from rest_framework.authentication import TokenAuthentication
from inventory.permissions import CanViewReports
from hr.models import PayrollRun

# ReportLab imports for PDF generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

import os as _os

_FONTS_DIR = _os.path.join(_os.path.dirname(__file__), 'fonts')
_arabic_fonts_registered = False

def _register_arabic_fonts():
    global _arabic_fonts_registered
    if not _arabic_fonts_registered:
        try:
            pdfmetrics.registerFont(TTFont('Amiri', _os.path.join(_FONTS_DIR, 'Amiri-Regular.ttf')))
            pdfmetrics.registerFont(TTFont('Amiri-Bold', _os.path.join(_FONTS_DIR, 'Amiri-Bold.ttf')))
            _arabic_fonts_registered = True
        except Exception as e:
            print(f"[WARN] Arabic font registration failed: {e}")

# Arabic text handling
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_SUPPORT = True
except ImportError:
    ARABIC_SUPPORT = False

from inventory.models import Sale, SaleItem, Product, StoreSettings, Purchase, Expense
from treasury.models import TreasuryTransaction


def get_store_branding():
    """
    Fetch store branding information from StoreSettings.
    Returns a dictionary with company info for PDF headers.
    """
    try:
        settings = StoreSettings.objects.first()
        if settings:
            return {
                'store_name': settings.store_name or '',
                'system_name': settings.system_name or '',
                'phone': settings.phone or '',
                'email': settings.email or '',
                'address': settings.address or '',
                'store_logo': settings.store_logo.url if settings.store_logo else None,
            }
    except Exception:
        pass
    return {
        'store_name': '',
        'system_name': '',
        'phone': '',
        'email': '',
        'address': '',
        'store_logo': None,
    }


def reshape_arabic(text):
    """Reshape Arabic text for PDF rendering"""
    if not ARABIC_SUPPORT or not text:
        return str(text) if text else ""
    try:
        reshaped = arabic_reshaper.reshape(str(text))
        return get_display(reshaped)
    except:
        return str(text)


def ar_p(text, bold=False, size=10, align=TA_CENTER):
    """
    Creates a Paragraph with Amiri font for Arabic text.
    Use this for ALL Arabic text in table cells and headings.
    """
    styles = getSampleStyleSheet()
    style = ParagraphStyle(
        'ArabicCell',
        parent=styles['Normal'],
        fontName='Amiri-Bold' if bold else 'Amiri',
        fontSize=size,
        alignment=align,
        leading=size + 6,
        wordWrap='RTL',
    )
    return Paragraph(reshape_arabic(str(text)) if text else '', style)


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
        
        # Calculate discount from explicit discount field (NOT total_amount - final_amount)
        # The old formula was wrong because it included tax adjustments
        total_discount = sales.aggregate(
            total=Sum('discount')
        )['total'] or Decimal('0')

        total_tax = sales.aggregate(
            total=Sum('tax_amount')
        )['total'] or Decimal('0')

        # Net revenue is final_amount (already after discount and tax)
        # Do NOT subtract discount again as that double-counts
        net_revenue = total_revenue

        # All payment types breakdown
        payment_breakdown = sales.aggregate(
            cash=Sum('final_amount', filter=Q(payment_type='cash')),
            credit=Sum('final_amount', filter=Q(payment_type='credit')),
            vodafone=Sum('final_amount', filter=Q(payment_type='vodafone_cash')),
            instapay=Sum('final_amount', filter=Q(payment_type='instapay')),
            card=Sum('final_amount', filter=Q(payment_type='card')),
            installment=Sum('final_amount', filter=Q(payment_type='installment')),
        )
        
        cash_revenue = (
            (payment_breakdown['cash'] or Decimal('0')) +
            (payment_breakdown['vodafone'] or Decimal('0')) +
            (payment_breakdown['instapay'] or Decimal('0')) +
            (payment_breakdown['card'] or Decimal('0'))
        )
        credit_revenue = payment_breakdown['credit'] or Decimal('0')
        installment_revenue = payment_breakdown['installment'] or Decimal('0')

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
            'installment_revenue': float(installment_revenue),
            'payment_breakdown': {
                'cash': float(payment_breakdown['cash'] or 0),
                'vodafone_cash': float(payment_breakdown['vodafone'] or 0),
                'instapay': float(payment_breakdown['instapay'] or 0),
                'card': float(payment_breakdown['card'] or 0),
                'credit': float(payment_breakdown['credit'] or 0),
                'installment': float(payment_breakdown['installment'] or 0),
            },
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

        # All payment types breakdown
        payment_breakdown = sales.aggregate(
            cash=Sum('final_amount', filter=Q(payment_type='cash')),
            credit=Sum('final_amount', filter=Q(payment_type='credit')),
            vodafone=Sum('final_amount', filter=Q(payment_type='vodafone_cash')),
            instapay=Sum('final_amount', filter=Q(payment_type='instapay')),
            card=Sum('final_amount', filter=Q(payment_type='card')),
            installment=Sum('final_amount', filter=Q(payment_type='installment')),
        )
        
        cash_revenue = (
            (payment_breakdown['cash'] or Decimal('0')) +
            (payment_breakdown['vodafone'] or Decimal('0')) +
            (payment_breakdown['instapay'] or Decimal('0')) +
            (payment_breakdown['card'] or Decimal('0'))
        )
        credit_revenue = payment_breakdown['credit'] or Decimal('0')
        installment_revenue = payment_breakdown['installment'] or Decimal('0')

        # Safe discount calculation
        # Fixed: Use explicit discount field instead of (total - final)
        total_discount = sales.aggregate(
            total=Sum('discount')
        )['total'] or Decimal('0')

        total_tax = sales.aggregate(
            total=Sum('tax_amount')
        )['total'] or Decimal('0')

        # Calculate COGS from SaleItems
        sale_items = SaleItem.objects.filter(
            sale__created_at__date__gte=from_dt,
            sale__created_at__date__lte=to_dt,
        )
        cogs = Decimal('0')
        for item in sale_items:
            cost = item.cost_price_at_sale or Decimal('0')
            cogs += cost * item.quantity

        # Calculate Operating Expenses (from Expense model)
        expenses = Expense.objects.filter(
            date__gte=from_dt,
            date__lte=to_dt,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        # Calculate Treasury expenses (manual entries only, not mirrored from other sources)
        # Exclude: expense, purchase, payroll (already counted via their source models)
        # Include: MANUAL category or NULL reference_type (direct treasury entries)
        treasury_expenses = TreasuryTransaction.objects.filter(
            created_at__date__gte=from_dt,
            created_at__date__lte=to_dt,
            transaction_type='EXPENSE',
            category='MANUAL',  # Only manual entries, not auto-generated
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        total_expenses = expenses + treasury_expenses

        # Net profit with proper P&L formula
        gross_profit = total_revenue - cogs
        net_profit = gross_profit - total_expenses

        # Payment split percentages (all types)
        if total_revenue > 0:
            cash_percentage = (cash_revenue / total_revenue) * 100
            credit_percentage = (credit_revenue / total_revenue) * 100
            installment_percentage = (installment_revenue / total_revenue) * 100
        else:
            cash_percentage = Decimal('0')
            credit_percentage = Decimal('0')
            installment_percentage = Decimal('0')

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
            'installment_revenue': float(installment_revenue),
            'payment_breakdown': {
                'cash': float(payment_breakdown['cash'] or 0),
                'vodafone_cash': float(payment_breakdown['vodafone'] or 0),
                'instapay': float(payment_breakdown['instapay'] or 0),
                'card': float(payment_breakdown['card'] or 0),
                'credit': float(payment_breakdown['credit'] or 0),
                'installment': float(payment_breakdown['installment'] or 0),
            },
            'total_tax_collected': float(total_tax),
            'total_discount_given': float(total_discount),
            'cogs': float(cogs),
            'gross_profit': float(gross_profit),
            'operating_expenses': float(expenses),
            'treasury_expenses': float(treasury_expenses),
            'total_expenses': float(total_expenses),
            'net_profit_estimate': float(net_profit),
            'daily_cash_flow': formatted_daily,
            'payment_split': {
                'cash_percentage': round(float(cash_percentage), 2),
                'credit_percentage': round(float(credit_percentage), 2),
                'installment_percentage': round(float(installment_percentage), 2),
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
        _register_arabic_fonts()
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

        # Get store branding
        branding = get_store_branding()

        # Company Header with Branding
        header_style = ParagraphStyle(
            'CompanyHeader',
            parent=styles['Heading1'],
            fontName='Amiri-Bold',
            fontSize=16,
            alignment=TA_CENTER,
            spaceAfter=6
        )
        company_info_style = ParagraphStyle(
            'CompanyInfo',
            parent=styles['Normal'],
            fontName='Amiri',
            fontSize=10,
            alignment=TA_CENTER,
            spaceAfter=4
        )

        # Add company name/system name
        company_name = branding['store_name'] or branding['system_name'] or 'Smart ERP'
        if company_name:
            elements.append(Paragraph(reshape_arabic(company_name), header_style))

        # Add contact info line
        contact_parts = []
        if branding['phone']:
            contact_parts.append(f"هاتف: {branding['phone']}")
        if branding['email']:
            contact_parts.append(f"بريد: {branding['email']}")
        if contact_parts:
            elements.append(Paragraph(
                reshape_arabic(' | '.join(contact_parts)),
                company_info_style
            ))

        # Add address if available
        if branding['address']:
            elements.append(Paragraph(
                reshape_arabic(f"العنوان: {branding['address']}"),
                company_info_style
            ))

        # Add separator line
        if branding['store_name'] or branding['system_name']:
            elements.append(Spacer(1, 10))
            elements.append(Table([['']], colWidths=[16*cm], style=TableStyle([
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#2c3e50')),
            ])))
            elements.append(Spacer(1, 15))

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName='Amiri-Bold',
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
                ar_p('إجمالي الفواتير', bold=True),
                ar_p('إجمالي الإيرادات', bold=True),
                ar_p('الخصومات', bold=True),
                ar_p('الصافي', bold=True),
            ],
            [
                ar_p(str(data['total_invoices'])),
                ar_p(f"{data['total_revenue']:.2f}"),
                ar_p(f"{data['total_discount']:.2f}"),
                ar_p(f"{data['net_revenue']:.2f}"),
            ]
        ]

        summary_table = Table(summary_data, colWidths=[3.5*cm]*4)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Amiri'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Top Products Table
        elements.append(ar_p('أفضل المنتجات مبيعاً', bold=True, size=14, align=TA_RIGHT))
        elements.append(Spacer(1, 10))

        products_data = [[
            ar_p('المنتج', bold=True),
            ar_p('الكمية المباعة', bold=True),
            ar_p('الإيرادات', bold=True),
        ]]

        for p in data['top_products'][:5]:
            products_data.append([
                ar_p(p['product_name']),
                ar_p(str(p['quantity_sold'])),
                ar_p(f"{p['revenue']:.2f}"),
            ])

        products_table = Table(products_data, colWidths=[7*cm, 4*cm, 4*cm])
        products_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#27ae60')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(products_table)
        elements.append(Spacer(1, 20))

        # Top Cashiers Table
        elements.append(ar_p('أفضل الكاشيرين', bold=True, size=14, align=TA_RIGHT))
        elements.append(Spacer(1, 10))

        cashiers_data = [[
            ar_p('الكاشير', bold=True),
            ar_p('عدد الفواتير', bold=True),
            ar_p('الإيرادات', bold=True),
        ]]

        for c in data['top_cashiers'][:5]:
            cashiers_data.append([
                ar_p(c['cashier_name']),
                ar_p(str(c['invoices_count'])),
                ar_p(f"{c['revenue']:.2f}"),
            ])

        cashiers_table = Table(cashiers_data, colWidths=[7*cm, 4*cm, 4*cm])
        cashiers_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
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
        data_response = view.get(request)

        if isinstance(data_response, Response) and data_response.status_code != 200:
            return data_response

        data = data_response.data

        # Generate PDF
        _register_arabic_fonts()
        pdf_response = HttpResponse(content_type='application/pdf')
        pdf_response['Content-Disposition'] = 'attachment; filename="inventory_report.pdf"'

        doc = SimpleDocTemplate(
            pdf_response,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )

        elements = []
        styles = getSampleStyleSheet()

        # Get store branding
        branding = get_store_branding()

        # Company Header with Branding
        header_style = ParagraphStyle(
            'CompanyHeader',
            parent=styles['Heading1'],
            fontName='Amiri-Bold',
            fontSize=16,
            alignment=TA_CENTER,
            spaceAfter=6
        )
        company_info_style = ParagraphStyle(
            'CompanyInfo',
            parent=styles['Normal'],
            fontName='Amiri',
            fontSize=10,
            alignment=TA_CENTER,
            spaceAfter=4
        )

        # Add company name/system name
        company_name = branding['store_name'] or branding['system_name'] or 'Smart ERP'
        if company_name:
            elements.append(Paragraph(reshape_arabic(company_name), header_style))

        # Add contact info line
        contact_parts = []
        if branding['phone']:
            contact_parts.append(f"هاتف: {branding['phone']}")
        if branding['email']:
            contact_parts.append(f"بريد: {branding['email']}")
        if contact_parts:
            elements.append(Paragraph(
                reshape_arabic(' | '.join(contact_parts)),
                company_info_style
            ))

        # Add address if available
        if branding['address']:
            elements.append(Paragraph(
                reshape_arabic(f"العنوان: {branding['address']}"),
                company_info_style
            ))

        # Add separator line
        if branding['store_name'] or branding['system_name']:
            elements.append(Spacer(1, 10))
            elements.append(Table([['']], colWidths=[16*cm], style=TableStyle([
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#2c3e50')),
            ])))
            elements.append(Spacer(1, 15))

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName='Amiri-Bold',
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=20
        )

        elements.append(Paragraph(reshape_arabic('تقرير المخزون'), title_style))
        elements.append(Spacer(1, 20))

        # Summary
        summary_data = [
            [ar_p('إجمالي المنتجات', bold=True), ar_p(str(data['total_products']))],
            [ar_p('قيمة المخزون', bold=True), ar_p(f"{data['stock_value']:.2f}")],
            [ar_p('منتجات منخفضة المخزون', bold=True), ar_p(str(len(data['low_stock_products'])))],
            [ar_p('منتجات نفدت من المخزون', bold=True), ar_p(str(len(data['out_of_stock'])))]
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
            elements.append(ar_p('منتجات منخفضة المخزون', bold=True, size=14, align=TA_RIGHT))
            elements.append(Spacer(1, 10))

            low_data = [[
                ar_p('المنتج', bold=True),
                ar_p('المخزون الحالي', bold=True),
                ar_p('الحد الأدنى', bold=True),
                ar_p('النقص', bold=True),
            ]]

            for p in data['low_stock_products'][:10]:
                low_data.append([
                    ar_p(p['name']),
                    ar_p(str(p['current_stock'])),
                    ar_p(str(p['min_stock_level'])),
                    ar_p(str(p['shortage'])),
                ])

            low_table = Table(low_data, colWidths=[5*cm, 3*cm, 3*cm, 3*cm])
            low_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e74c3c')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(low_table)
            elements.append(Spacer(1, 20))

        # Top Selling Products
        if data['top_selling_products']:
            elements.append(ar_p('أفضل المنتجات مبيعاً', bold=True, size=14, align=TA_RIGHT))
            elements.append(Spacer(1, 10))

            top_data = [[
                ar_p('المنتج', bold=True),
                ar_p('الكمية المباعة', bold=True),
                ar_p('الإيرادات', bold=True),
            ]]

            for p in data['top_selling_products'][:10]:
                top_data.append([
                    ar_p(p['product_name']),
                    ar_p(str(p['quantity_sold'])),
                    ar_p(f"{p['revenue']:.2f}"),
                ])

            top_table = Table(top_data, colWidths=[7*cm, 4*cm, 4*cm])
            top_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#27ae60')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(top_table)

        doc.build(elements)
        return add_cors_headers(pdf_response)

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
        data_response = view.get(request)

        if isinstance(data_response, Response) and data_response.status_code != 200:
            return data_response

        data = data_response.data

        # Generate PDF
        _register_arabic_fonts()
        pdf_response = HttpResponse(content_type='application/pdf')
        pdf_response['Content-Disposition'] = f'attachment; filename="financial_report_{from_date}_to_{to_date}.pdf"'

        doc = SimpleDocTemplate(
            pdf_response,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )

        elements = []
        styles = getSampleStyleSheet()

        # Get store branding
        branding = get_store_branding()

        # Company Header with Branding
        header_style = ParagraphStyle(
            'CompanyHeader',
            parent=styles['Heading1'],
            fontName='Amiri-Bold',
            fontSize=16,
            alignment=TA_CENTER,
            spaceAfter=6
        )
        company_info_style = ParagraphStyle(
            'CompanyInfo',
            parent=styles['Normal'],
            fontName='Amiri',
            fontSize=10,
            alignment=TA_CENTER,
            spaceAfter=4
        )

        # Add company name/system name
        company_name = branding['store_name'] or branding['system_name'] or 'Smart ERP'
        if company_name:
            elements.append(Paragraph(reshape_arabic(company_name), header_style))

        # Add contact info line
        contact_parts = []
        if branding['phone']:
            contact_parts.append(f"هاتف: {branding['phone']}")
        if branding['email']:
            contact_parts.append(f"بريد: {branding['email']}")
        if contact_parts:
            elements.append(Paragraph(
                reshape_arabic(' | '.join(contact_parts)),
                company_info_style
            ))

        # Add address if available
        if branding['address']:
            elements.append(Paragraph(
                reshape_arabic(f"العنوان: {branding['address']}"),
                company_info_style
            ))

        # Add separator line
        if branding['store_name'] or branding['system_name']:
            elements.append(Spacer(1, 10))
            elements.append(Table([['']], colWidths=[16*cm], style=TableStyle([
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#2c3e50')),
            ])))
            elements.append(Spacer(1, 15))

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontName='Amiri-Bold',
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
            [ar_p('البيان', bold=True), ar_p('القيمة', bold=True)],
            [ar_p('إجمالي الإيرادات'), ar_p(f"{data['total_revenue']:.2f}")],
            [ar_p('إيرادات الكاش'), ar_p(f"{data['cash_revenue']:.2f}")],
            [ar_p('إيرادات الآجل'), ar_p(f"{data['credit_revenue']:.2f}")],
            [ar_p('إجمالي الضرائب'), ar_p(f"{data['total_tax_collected']:.2f}")],
            [ar_p('إجمالي الخصومات'), ar_p(f"{data['total_discount_given']:.2f}")],
            [ar_p('صافي الربح المقدر'), ar_p(f"{data['net_profit_estimate']:.2f}")]
        ]

        summary_table = Table(summary_data, colWidths=[8*cm, 7*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
            ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#ecf0f1')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, -1), (-1, -1), 'Amiri-Bold'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Payment Split
        elements.append(ar_p('توزيع طرق الدفع', bold=True, size=14, align=TA_RIGHT))
        elements.append(Spacer(1, 10))

        split_data = [
            [ar_p('طريقة الدفع', bold=True), ar_p('النسبة', bold=True)],
            [ar_p('كاش'), ar_p(f"{data['payment_split']['cash_percentage']}%")],
            [ar_p('آجل'), ar_p(f"{data['payment_split']['credit_percentage']}%")]
        ]

        split_table = Table(split_data, colWidths=[7.5*cm, 7.5*cm])
        split_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8e44ad')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(split_table)
        elements.append(Spacer(1, 20))

        # Daily Cash Flow
        if data['daily_cash_flow']:
            elements.append(ar_p('التدفق النقدي اليومي', bold=True, size=14, align=TA_RIGHT))
            elements.append(Spacer(1, 10))

            flow_data = [[
                ar_p('التاريخ', bold=True),
                ar_p('الكاش', bold=True),
                ar_p('الآجل', bold=True),
                ar_p('الإجمالي', bold=True)
            ]]

            for d in data['daily_cash_flow']:
                flow_data.append([
                    ar_p(d['date']),
                    ar_p(f"{d['cash_in']:.2f}"),
                    ar_p(f"{d['credit_in']:.2f}"),
                    ar_p(f"{d['total']:.2f}")
                ])

            flow_table = Table(flow_data, colWidths=[4*cm, 3.5*cm, 3.5*cm, 3.5*cm])
            flow_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2980b9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Amiri-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            elements.append(flow_table)

        doc.build(elements)
        return add_cors_headers(pdf_response)

    def options(self, request, *args, **kwargs):
        response = HttpResponse()
        return add_cors_headers(response)


# ==================== P&L REPORT VIEW ====================


def get_date_range(request):
    """استخراج نطاق التاريخ من الـ request"""
    date_from = request.query_params.get('date_from')
    date_to   = request.query_params.get('date_to')

    if date_from:
        date_from = date.fromisoformat(date_from)
    else:
        today = date.today()
        date_from = today.replace(day=1)

    if date_to:
        date_to = date.fromisoformat(date_to)
    else:
        date_to = date.today()

    return date_from, date_to


def get_previous_period(date_from, date_to):
    """حساب الفترة السابقة بنفس المدة"""
    delta = date_to - date_from
    prev_to   = date_from - timedelta(days=1)
    prev_from = prev_to - delta
    return prev_from, prev_to


def calculate_pl(date_from, date_to):
    """حساب P&L لفترة معينة"""

    # ── الإيرادات ──────────────────────────────
    sales_qs = Sale.objects.filter(
        created_at__date__gte=date_from,
        created_at__date__lte=date_to,
    )

    revenue_cash = sales_qs.filter(
        payment_type='cash'
    ).aggregate(t=Sum('final_amount'))['t'] or Decimal('0')

    revenue_electronic = sales_qs.filter(
        payment_type__in=['vodafone_cash', 'instapay', 'card']
    ).aggregate(t=Sum('final_amount'))['t'] or Decimal('0')

    revenue_credit = sales_qs.filter(
        payment_type='credit'
    ).aggregate(t=Sum('final_amount'))['t'] or Decimal('0')

    revenue_installment = sales_qs.filter(
        payment_type='installment'
    ).aggregate(t=Sum('final_amount'))['t'] or Decimal('0')

    total_revenue = (
        revenue_cash + revenue_electronic +
        revenue_credit + revenue_installment
    )

    total_discount = sales_qs.aggregate(
        t=Sum('discount')
    )['t'] or Decimal('0')

    total_tax = sales_qs.aggregate(
        t=Sum('tax_amount')
    )['t'] or Decimal('0')

    # ── COGS ────────────────────────────────────
    items_qs = SaleItem.objects.filter(
        sale__created_at__date__gte=date_from,
        sale__created_at__date__lte=date_to,
    )

    cogs = Decimal('0')
    for item in items_qs:
        cost = item.cost_price_at_sale or Decimal('0')
        cogs += cost * item.quantity

    # ── مجمل الربح ──────────────────────────────
    gross_profit = total_revenue - cogs
    gross_margin = (
        (gross_profit / total_revenue * 100)
        if total_revenue > 0 else Decimal('0')
    )

    # ── المصروفات ───────────────────────────────
    expenses_qs = Expense.objects.filter(
        date__gte=date_from,
        date__lte=date_to,
    )

    exp_rent = expenses_qs.filter(
        category='rent'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

    exp_electricity = expenses_qs.filter(
        category='electricity'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

    exp_maintenance = expenses_qs.filter(
        category='maintenance'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

    exp_other = expenses_qs.filter(
        category='other'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

    total_expenses_operational = (
        exp_rent + exp_electricity +
        exp_maintenance + exp_other
    )

    # ── الرواتب ─────────────────────────────────
    payroll_qs = PayrollRun.objects.filter(
        status='paid',
        paid_at__date__gte=date_from,
        paid_at__date__lte=date_to,
    )

    total_salaries = payroll_qs.aggregate(
        t=Sum('total_net')
    )['t'] or Decimal('0')

    # ── مصروفات الخزينة اليدوية ──────────────────
    # Include manual treasury expenses (category='MANUAL') to align with Financial Report
    treasury_expenses_manual = TreasuryTransaction.objects.filter(
        created_at__date__gte=date_from,
        created_at__date__lte=date_to,
        transaction_type='EXPENSE',
        category='MANUAL',
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    total_expenses = total_expenses_operational + total_salaries + treasury_expenses_manual

    # ── صافي الربح ──────────────────────────────
    net_profit = gross_profit - total_expenses
    net_margin = (
        (net_profit / total_revenue * 100)
        if total_revenue > 0 else Decimal('0')
    )

    # ── إحصائيات إضافية ─────────────────────────
    total_invoices = sales_qs.count()
    avg_invoice    = (
        total_revenue / total_invoices
        if total_invoices > 0 else Decimal('0')
    )

    return {
        'period': {
            'date_from': str(date_from),
            'date_to':   str(date_to),
        },
        'revenue': {
            'cash':        str(revenue_cash),
            'electronic':  str(revenue_electronic),
            'credit':      str(revenue_credit),
            'installment': str(revenue_installment),
            'total':       str(total_revenue),
            'discount':    str(total_discount),
            'tax':         str(total_tax),
        },
        'cogs': str(cogs),
        'gross_profit': str(gross_profit),
        'gross_margin': str(gross_margin.quantize(Decimal('0.01'))),
        'expenses': {
            'rent':              str(exp_rent),
            'electricity':       str(exp_electricity),
            'maintenance':       str(exp_maintenance),
            'other':             str(exp_other),
            'salaries':          str(total_salaries),
            'treasury_manual':   str(treasury_expenses_manual),
            'total':             str(total_expenses),
        },
        'net_profit': str(net_profit),
        'net_margin': str(net_margin.quantize(Decimal('0.01'))),
        'stats': {
            'total_invoices': total_invoices,
            'avg_invoice':    str(avg_invoice.quantize(Decimal('0.01'))),
        },
    }


class PLReportView(APIView):
    """
    GET /api/reports/pl/
    params: date_from (YYYY-MM-DD), date_to (YYYY-MM-DD)
    يرجع P&L كامل مع مقارنة بالفترة السابقة
    """
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated, CanViewReports]

    def get(self, request):
        date_from, date_to = get_date_range(request)
        prev_from, prev_to = get_previous_period(date_from, date_to)

        current  = calculate_pl(date_from, date_to)
        previous = calculate_pl(prev_from, prev_to)

        # حساب نسب التغيير
        def pct_change(curr, prev):
            c = Decimal(str(curr))
            p = Decimal(str(prev))
            if p == 0:
                return '0.00'
            change = ((c - p) / abs(p) * 100).quantize(Decimal('0.01'))
            return str(change)

        comparison = {
            'revenue_change':     pct_change(
                current['revenue']['total'],
                previous['revenue']['total']
            ),
            'cogs_change':        pct_change(
                current['cogs'],
                previous['cogs']
            ),
            'gross_profit_change': pct_change(
                current['gross_profit'],
                previous['gross_profit']
            ),
            'expenses_change':    pct_change(
                current['expenses']['total'],
                previous['expenses']['total']
            ),
            'net_profit_change':  pct_change(
                current['net_profit'],
                previous['net_profit']
            ),
        }

        return Response({
            'current':    current,
            'previous':   previous,
            'comparison': comparison,
        })
