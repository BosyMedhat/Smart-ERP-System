from django.http import JsonResponse
from langchain_ollama import OllamaLLM
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, F
from inventory.models import Sale, SaleItem, Product
import statistics
import json
import pdfplumber
import requests


@api_view(['POST'])
def ask_ai(request):
    """
    AI Assistant endpoint with qwen2.5:3b integration via Ollama Docker container.
    Includes timeout, system context, and graceful error handling.
    """
    try:
        data = request.data
        message = data.get('query', '')
        context_data = data.get('context_data', [])

        # Initialize Ollama LLM with extended timeout
        llm = OllamaLLM(
            model="qwen2.5:3b",
            base_url="http://127.0.0.1:11434",
            timeout=120,  # 2 minutes timeout
            num_predict=500,
            keep_alive=-1,
        )

        # Fetch real system context
        today = timezone.now().date()
        sales_today = Sale.objects.filter(
            created_at__date=today
        ).count()
        products_count = Product.objects.count()

        # Format anomaly context if provided
        anomaly_context = ""
        if context_data:
            anomaly_context = "\nالعمليات المشبوهة المكتشفة:\n"
            for item in context_data:
                anomaly_context += f"- {item.get('employee', 'غير معروف')}: {item.get('operationType', 'عملية')} - {item.get('value', 0)} ج.م\n"

        system_context = f"""أنت مساعد ذكي لنظام Smart ERP للمدير جمال.

بيانات النظام الحالية:
- مبيعات اليوم: {sales_today} عملية
- إجمالي المنتجات: {products_count} منتج
- التاريخ: {today}
{anomaly_context}

أجب باللغة العربية بشكل مختصر ومفيد واحترافي.
إذا كان السؤال عن المخزون أو المبيعات، استخدم البيانات المتوفرة.
إذا كان السؤال عاماً، أجب بشكل مفيد للمدير."""

        full_prompt = f"{system_context}\n\nسؤال المدير: {message}\n\nالرد:"
        response = llm.invoke(full_prompt)

        return JsonResponse({
            'status': 'success',
            'response': response
        })

    except Exception as e:
        print(f"Ollama Error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'response': f'المساعد يحتاج لحظة للتحميل، يرجى المحاولة مرة أخرى. ({str(e)[:50]})'
        }, status=200)


class SmartAnalyticsView(APIView):
    """
    Smart Analytics View providing AI-powered insights:
    - Sales analytics (30 days)
    - Top selling products
    - Low stock alerts
    - Anomaly detection (statistical)
    - Sales forecast
    - Smart recommendations
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        month_ago = today - timedelta(days=30)

        # Sales in last 30 days
        sales_30 = Sale.objects.filter(
            created_at__date__gte=month_ago
        )
        total_30 = sales_30.aggregate(
            t=Sum('final_amount'))['t'] or 0
        count_30 = sales_30.count()

        # Top selling products
        top_products = SaleItem.objects.filter(
            sale__created_at__date__gte=month_ago
        ).values('product_name').annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_qty')[:5]

        # Low stock alerts
        low_stock = Product.objects.filter(
            current_stock__lte=F('min_stock_level')
        ).values('name', 'current_stock', 'min_stock_level')[:10]

        # Anomaly Detection using statistical method
        all_amounts = list(
            Sale.objects.values_list('final_amount', flat=True)
        )
        anomalies = []
        if len(all_amounts) >= 3:
            try:
                avg = statistics.mean(float(x) for x in all_amounts)
                std = statistics.stdev(float(x) for x in all_amounts)
                threshold = avg + (2 * std)

                suspicious = Sale.objects.filter(
                    final_amount__gte=threshold
                ).select_related('customer', 'cashier') \
                 .order_by('-final_amount')[:5]

                for s in suspicious:
                    anomalies.append({
                        'invoice': s.invoice_number,
                        'amount': float(s.final_amount),
                        'customer': s.customer.name
                                 if s.customer else 'عميل نقدي',
                        'cashier': (s.cashier.first_name or s.cashier.username)
                                 if s.cashier else 'غير محدد',
                        'date': s.created_at.strftime('%d/%m/%Y'),
                        'reason': f'مبلغ يتجاوز المعدل الطبيعي '
                                 f'(المتوسط: {avg:.0f} ج.م)',
                        'severity': 'high' if s.final_amount > threshold * 1.5 else 'medium'
                    })
            except Exception as e:
                print(f"Anomaly detection error: {e}")

        # Weekly sales forecast
        weekly_totals = []
        for w in range(4):
            start = today - timedelta(days=(w+1)*7)
            end = today - timedelta(days=w*7)
            wt = Sale.objects.filter(
                created_at__date__gte=start,
                created_at__date__lt=end
            ).aggregate(t=Sum('final_amount'))['t'] or 0
            weekly_totals.append(float(wt))

        forecast = statistics.mean(weekly_totals) if weekly_totals else 0

        # Smart recommendations
        recommendations = []
        low_stock_count = Product.objects.filter(
            current_stock__lte=F('min_stock_level')
        ).count()

        if low_stock_count > 0:
            recommendations.append({
                'type': 'warning',
                'title': 'مخزون منخفض',
                'message': f'{low_stock_count} منتجات تحتاج إعادة طلب',
                'icon': '⚠️'
            })

        if top_products:
            best = list(top_products)[0]
            recommendations.append({
                'type': 'success',
                'title': 'الأكثر مبيعاً',
                'message': f'{best["product_name"]} — {best["total_qty"]} وحدة',
                'icon': '🏆'
            })

        if forecast > 0:
            recommendations.append({
                'type': 'info',
                'title': 'توقع الأسبوع القادم',
                'message': f'المتوقع: {forecast:,.0f} ج.م',
                'icon': '📈'
            })

        # Sales trend for chart (last 6 months)
        sales_trend = []
        for i in range(5, -1, -1):
            month_start = today.replace(day=1) - timedelta(days=i*30)
            month_end = today.replace(day=1) - timedelta(days=(i-1)*30) if i > 0 else today + timedelta(days=1)
            month_total = Sale.objects.filter(
                created_at__date__gte=month_start,
                created_at__date__lt=month_end
            ).aggregate(t=Sum('final_amount'))['t'] or 0
            sales_trend.append({
                'month': month_start.strftime('%b'),
                'actual': float(month_total),
                'forecast': None
            })

        # Add forecast for next month
        sales_trend.append({
            'month': 'توقع',
            'actual': None,
            'forecast': forecast * 4  # Monthly forecast
        })

        return Response({
            'summary': {
                'total_sales_30_days': float(total_30),
                'operations_count_30_days': count_30,
                'forecast_next_week': forecast,
                'low_stock_count': low_stock_count,
            },
            'top_products': list(top_products),
            'low_stock_alerts': list(low_stock),
            'anomalies': anomalies,
            'recommendations': recommendations,
            'sales_trend': sales_trend,
        })


class PDFProductImportView(APIView):
    """
    PDF Product Import View.
    Accepts a PDF file, extracts text using pdfplumber,
    sends to Ollama (qwen2.5:3b) for AI parsing,
    returns structured product data as JSON preview.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            pdf_file = request.FILES.get('file')
            if not pdf_file:
                return Response({
                    'status': 'error',
                    'message': 'لم يتم رفع ملف PDF'
                }, status=400)

            # Extract text from PDF
            extracted_text = ""
            try:
                with pdfplumber.open(pdf_file) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            extracted_text += page_text + "\n"
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': f'خطأ في قراءة ملف PDF: {str(e)}'
                }, status=400)

            if not extracted_text.strip():
                return Response({
                    'status': 'error',
                    'message': 'لم يتم استخراج أي نص من ملف PDF'
                }, status=400)

            # Prepare prompt for Ollama
            prompt = f"""
أنت مساعد ذكي لنظام ERP. 
المهمة: استخرج قائمة المنتجات من النص التالي وأرجعها كـ JSON فقط.

الصيغة المطلوبة:
{{
  "products": [
    {{
      "name": "اسم المنتج",
      "retail_price": 0.0,
      "wholesale_price": 0.0,
      "category": "الفئة",
      "unit": "الوحدة",
      "quantity": 0
    }}
  ]
}}

قواعد مهمة:
- أرجع JSON فقط بدون أي نص إضافي
- إذا لم تجد سعراً، اجعله 0
- إذا لم تجد فئة، اجعلها "عام"
- إذا لم تجد وحدة، اجعلها "قطعة"

النص:
{extracted_text[:2000]}
"""

            # Call Ollama API
            try:
                response = requests.post(
                    'http://localhost:11434/api/generate',
                    json={
                        'model': 'qwen2.5:3b',
                        'prompt': prompt,
                        'stream': False,
                        'keep_alive': -1,
                        'options': {
                            'temperature': 0.1,
                            'num_predict': 1000
                        }
                    },
                    timeout=300
                )
                response.raise_for_status()
                ai_response = response.json()
                ai_text = ai_response.get('response', '')
            except requests.exceptions.Timeout:
                return Response({
                    'status': 'error',
                    'message': 'انتهى الوقت المحدد للانتظار - Ollama بطيء'
                }, status=504)
            except requests.exceptions.ConnectionError:
                return Response({
                    'status': 'error',
                    'message': 'تعذر الاتصال بـ Ollama - تأكد من تشغيل الخدمة'
                }, status=503)
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': f'خطأ في الاتصال بـ Ollama: {str(e)}'
                }, status=500)

            # Parse JSON from AI response
            try:
                # Find JSON in response (in case there's extra text)
                json_start = ai_text.find('{')
                json_end = ai_text.rfind('}')
                if json_start != -1 and json_end != -1:
                    json_str = ai_text[json_start:json_end + 1]
                    products_data = json.loads(json_str)
                    products = products_data.get('products', [])
                else:
                    products = []
            except json.JSONDecodeError as e:
                return Response({
                    'status': 'error',
                    'message': f'فشل في تحليل JSON من الرد: {str(e)}',
                    'raw_response': ai_text[:500]
                }, status=400)

            return Response({
                'status': 'success',
                'products': products,
                'count': len(products),
                'extracted_text_preview': extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
            })

        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'خطأ غير متوقع: {str(e)}'
            }, status=500)