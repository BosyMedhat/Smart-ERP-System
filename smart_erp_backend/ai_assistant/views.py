from django.http import JsonResponse
from langchain_ollama import OllamaLLM
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, F
from decimal import Decimal
from inventory.models import Sale, SaleItem, Product
from treasury.models import TreasuryAccount, TreasuryTransaction
from treasury.serializers import ManualTransactionSerializer
from treasury.permissions import CanManageTreasuryFull
from audit.utils import log_action, get_client_ip
import statistics
import json
import re
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


class AnalyzeInvoiceView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {'error': 'لم يتم إرفاق صورة'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png',
                         'image/jpg', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'نوع الملف غير مدعوم. استخدم JPG أو PNG'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'حجم الصورة يتجاوز 5 ميجابايت'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            import base64
            image_data = base64.b64encode(
                image_file.read()
            ).decode('utf-8')

            prompt = """أنت نظام استخراج بيانات من فواتير.
حلل هذه الصورة واستخرج المعلومات التالية بتنسيق JSON فقط:
{
  "supplier_name": "اسم المورد أو الشركة",
  "invoice_number": "رقم الفاتورة",
  "invoice_date": "تاريخ الفاتورة",
  "total_amount": "المبلغ الإجمالي",
  "items": [
    {
      "name": "اسم المنتج",
      "quantity": "الكمية",
      "unit_price": "سعر الوحدة",
      "total": "الإجمالي"
    }
  ],
  "notes": "أي ملاحظات مهمة"
}
إذا لم تتمكن من استخراج قيمة معينة، اكتب null.
أجب بـ JSON فقط بدون أي نص إضافي."""

            import requests as req
            ollama_response = req.post(
                'http://localhost:11434/api/generate',
                json={
                    'model': 'qwen2.5:3b',
                    'prompt': prompt,
                    'images': [image_data],
                    'stream': False,
                    'keep_alive': -1
                },
                timeout=60
            )

            if ollama_response.status_code != 200:
                return Response(
                    {'error': 'فشل في الاتصال بنموذج الذكاء الاصطناعي'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            result_text = ollama_response.json().get(
                'response', ''
            ).strip()

            # Try to parse as JSON
            import json
            try:
                # Clean markdown code blocks if present
                clean = result_text.replace(
                    '```json', ''
                ).replace('```', '').strip()
                parsed = json.loads(clean)
                return Response({
                    'success': True,
                    'data': parsed,
                    'raw': result_text
                })
            except json.JSONDecodeError:
                return Response({
                    'success': True,
                    'data': None,
                    'raw': result_text
                })

        except Exception as e:
            return Response(
                {'error': f'حدث خطأ: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ─────────────────────────────────────────────────────────────────
# AI ACTION ASSISTANT — Phase 1
# ─────────────────────────────────────────────────────────────────

# Allowed expense categories for Phase 1
_ALLOWED_CATEGORIES = {
    'ELECTRICITY', 'RENT', 'MAINTENANCE', 'SALARY', 'MANUAL', 'OTHER'
}

# Large amount threshold — triggers requires_extra_confirmation flag
_LARGE_AMOUNT_THRESHOLD = Decimal('50000')

# ── Normalization helper ────────────────────────────────────────
def _normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for consistent matching:
    - Unify alef variants (أإآ → ا)
    - Unify alef-maqsura (ى → ي)
    - Unify taa-marbuta (ة → ه)
    - Strip tashkeel (diacritics)
    - Collapse whitespace
    """
    # Alef variants
    text = re.sub(r'[أإآ]', 'ا', text)
    # Alef-maqsura
    text = text.replace('ى', 'ي')
    # Taa-marbuta
    text = text.replace('ة', 'ه')
    # Arabic diacritics (fatha, damma, kasra, sukun, shadda, etc.)
    text = re.sub(r'[\u0610-\u061A\u064B-\u065F]', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# Arabic word-to-number map for rule-based fallback
# Keys are already normalized (no إأآ, no ة, no ى)
_ARABIC_NUMBERS = {
    # hundreds
    'ميه':       100,  'مائه':    100,  'مايه':    100,
    'ميتين':    200,  'مئتين':   200,
    'تلاتميه':  300,  'ثلاثميه': 300,  'ثلاثمائه': 300,
    'اربعميه':  400,
    'خمسميه':   500,  'بخمسميه': 500,
    'ستميه':    600,  'سبعميه':  700,
    'تمانميه':  800,  'تسعميه':  900,
    # thousands
    'الف':     1000,  'الفين':  2000,
    # tens (colloquial)
    'عشره':      10,  'عشرين':   20,  'تلاتين': 30,
    'اربعين':    40,  'خمسين':   50,  'ستين':   60,
    'سبعين':     70,  'تمانين':  80,  'تسعين':  90,
}

# Category keyword map — keys are normalized
# Order matters: more specific multi-word keys first
_CATEGORY_MAP = [
    # Electricity
    ('فاتوره كهرباء', 'ELECTRICITY', 'كهرباء'),
    ('فاتوره الكهرباء', 'ELECTRICITY', 'كهرباء'),
    ('كهرباء', 'ELECTRICITY', 'كهرباء'),
    ('كهربا', 'ELECTRICITY', 'كهرباء'),
    # Rent
    ('فاتوره ايجار', 'RENT', 'إيجار'),
    ('فاتوره الايجار', 'RENT', 'إيجار'),
    ('ايجارات', 'RENT', 'إيجار'),
    ('ايجار', 'RENT', 'إيجار'),
    # Maintenance
    ('صيانه', 'MAINTENANCE', 'صيانة'),
    # Salary
    ('رواتب', 'SALARY', 'رواتب'),
    ('راتب', 'SALARY', 'راتب'),
    ('مرتب', 'SALARY', 'مرتب'),
    ('مرتبات', 'SALARY', 'رواتب'),
]

# Expense intent trigger words — keys are normalized
_EXPENSE_TRIGGERS = [
    'سجل مصروف',
    'سجل صرف',
    'مصروف',
    'مصاريف',
    'صرف',
    'ادفع',
    'دفعت',
    'دفع',
    'خصم',
    'ادفع مصاريف',
    'سددت',
    'تكلفه',
    'تكاليف',
    'فاتوره كهرباء',
    'فاتوره ايجار',
    'دفعت كهرباء',
    'دفعت ايجار',
]


def _rule_based_parse(message: str) -> dict | None:
    """
    Rule-based fallback parser.
    Applies full Arabic normalization before all matching.
    Returns a dict with keys: amount, category, description
    or None if no expense intent detected.
    """
    normalized = _normalize_arabic(message)

    # Normalize trigger list for comparison
    has_trigger = any(_normalize_arabic(t) in normalized for t in _EXPENSE_TRIGGERS)
    if not has_trigger:
        return None

    # Try numeric amount first (digits in the message)
    amount = None
    amount_match = re.search(r'(?<![\u0600-\u06FF])(\d+(?:\.\d+)?)(?![\u0600-\u06FF])', normalized)
    if amount_match:
        amount = Decimal(amount_match.group(1))

    # Try Arabic word amounts if no numeric found
    if amount is None:
        for word, value in _ARABIC_NUMBERS.items():
            if _normalize_arabic(word) in normalized:
                amount = Decimal(value)
                break

    if amount is None:
        return None

    # Detect category — iterate ordered list, most-specific first
    category = 'OTHER'
    description = 'مصروف'
    for keyword, cat, label in _CATEGORY_MAP:
        if _normalize_arabic(keyword) in normalized:
            category    = cat
            description = label
            break

    return {
        'amount':      amount,
        'category':    category,
        'description': description,
        'confidence':  0.70,
        'parser':      'rule_based',
    }


def _ollama_parse(message: str) -> dict | None:
    """
    Ollama-based primary parser.
    Sends Arabic command to qwen2.5:3b and expects strict JSON output.
    Returns parsed dict or None on failure.
    """
    prompt = f"""أنت نظام استخراج بيانات من أوامر عربية لنظام ERP.

المهمة: حلل الأمر التالي وأرجع JSON فقط بدون أي نص إضافي.

الأمر: "{message}"

الصيغة المطلوبة:
{{
  "intent": "create_expense",
  "amount": <رقم فقط أو null إذا لم يوجد مبلغ>,
  "category": "<ELECTRICITY|RENT|MAINTENANCE|SALARY|MANUAL|OTHER>",
  "description": "<وصف قصير بالعربية>",
  "confidence": <0.0 إلى 1.0>
}}

مؤشرات تسجيل المصروف (إذا وجد أي منها مع مبلغ → intent=create_expense):
مصروف، صرف، سجل صرف، دفعت، ادفع، دفع، خصم، سددت، تكلفة، فاتورة، مصاريف

قواعد صارمة:
- إذا لم يكن الأمر تسجيل مصروف أو دفع، أرجع: {{"intent": "unknown"}}
- إذا لم يوجد مبلغ واضح في النص، أرجع: {{"intent": "unknown"}}
- لا تخترع مبلغاً غير موجود في الأمر
- تجاهل كلمات مثل: النهارده، امبارح، دلوقتي، الأسبوع (لا تؤثر على المبلغ)
- أرجع JSON فقط

الفئات المتاحة:
- كهرباء / فاتورة كهرباء → ELECTRICITY
- إيجار / ايجار / فاتورة إيجار → RENT
- صيانة → MAINTENANCE
- راتب / رواتب / مرتب → SALARY
- غير ذلك → OTHER"""

    try:
        resp = requests.post(
            'http://127.0.0.1:11434/api/generate',
            json={
                'model':  'qwen2.5:3b',
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.1,
                    'num_predict': 200,
                },
                'keep_alive': -1,
            },
            timeout=60,
        )
        resp.raise_for_status()
        raw = resp.json().get('response', '').strip()

        # Strip markdown fences if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'```\s*$', '', raw, flags=re.MULTILINE).strip()

        # Extract first JSON object
        start = raw.find('{')
        end   = raw.rfind('}')
        if start == -1 or end == -1:
            return None

        parsed = json.loads(raw[start:end + 1])

        if parsed.get('intent') != 'create_expense':
            return None

        raw_amount = parsed.get('amount')
        if raw_amount is None:
            return None

        return {
            'amount':      Decimal(str(raw_amount)),
            'category':    parsed.get('category', 'OTHER'),
            'description': parsed.get('description', ''),
            'confidence':  float(parsed.get('confidence', 0.85)),
            'parser':      'ollama',
        }

    except Exception:
        return None


def _validate_parsed(parsed: dict) -> str | None:
    """
    Validates a parsed result dict.
    Returns an Arabic error string or None if valid.
    """
    amount = parsed.get('amount')
    if amount is None:
        return 'لم يتم استخراج المبلغ من الأمر.'
    try:
        amount = Decimal(str(amount))
    except Exception:
        return 'المبلغ غير صالح.'
    if amount <= 0:
        return 'المبلغ يجب أن يكون أكبر من صفر.'

    category = parsed.get('category', '')
    if category not in _ALLOWED_CATEGORIES:
        return f'الفئة "{category}" غير مدعومة.'

    description = (parsed.get('description') or '').strip()
    if not description:
        return 'الوصف مطلوب.'

    return None


class AIActionParseView(APIView):
    """
    POST /api/ai/action/parse/
    Parse an Arabic natural-language command into a structured expense intent.
    Does NOT write to the database.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated, CanManageTreasuryFull]

    def post(self, request):
        message = (request.data.get('message') or '').strip()
        if not message:
            return Response(
                {'error': 'الرجاء إرسال أمر نصي.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 1: Try Ollama first
        parsed = _ollama_parse(message)
        parser_used = 'ollama'

        # Step 2: Fallback to rule-based if Ollama failed
        if parsed is None:
            parsed = _rule_based_parse(message)
            parser_used = 'rule_based'

        # Step 3: If both failed → unknown intent
        if parsed is None:
            return Response({
                'intent':               'unknown',
                'requires_confirmation': False,
                'parser':               parser_used,
                'error':                'لم أتمكن من فهم الأمر كإجراء مالي. جرّب: سجل مصروف 500 جنيه كهرباء',
            })

        # Step 4: Validate
        validation_error = _validate_parsed(parsed)
        if validation_error:
            return Response({
                'intent':               'create_expense',
                'requires_confirmation': False,
                'parser':               parser_used,
                'error':                validation_error,
            })

        amount   = Decimal(str(parsed['amount']))
        category = parsed['category']
        description = parsed['description'].strip()
        confidence  = parsed.get('confidence', 0.80)

        # Step 5: Resolve CASH account id
        try:
            cash_account = TreasuryAccount.objects.get(name='CASH', is_active=True)
            account_id   = cash_account.id
            account_name = cash_account.display_name
        except TreasuryAccount.DoesNotExist:
            return Response(
                {'error': 'لم يتم العثور على حساب الخزينة النقدية.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        requires_extra = amount > _LARGE_AMOUNT_THRESHOLD

        return Response({
            'intent':                'create_expense',
            'confidence':            confidence,
            'requires_confirmation': True,
            'requires_extra_confirmation': requires_extra,
            'parser':                parser_used,
            'data': {
                'account_id':        account_id,
                'transaction_type':  'EXPENSE',
                'category':          category,
                'amount':            str(amount),
                'description':       description,
            },
            'preview_message': (
                f'هل تريد تسجيل مصروف {description} بقيمة '
                f'{amount:,.2f} ج.م من {account_name}؟'
            ),
        })


class AIActionExecuteView(APIView):
    """
    POST /api/ai/action/execute/
    Execute a previously confirmed expense action.
    Creates TreasuryTransaction and writes AuditLog.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated, CanManageTreasuryFull]

    def post(self, request):
        source           = request.data.get('source', 'FLOATING_AI_ASSISTANT')
        original_command = (request.data.get('original_command') or '').strip()
        intent           = request.data.get('intent', '')
        data             = request.data.get('data') or {}
        parser_used      = request.data.get('parser', 'unknown')

        # Phase 1: only create_expense is allowed
        if intent != 'create_expense':
            return Response(
                {'error': 'هذا النوع من الإجراءات غير مدعوم في المرحلة الأولى.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Re-validate via existing serializer
        serializer = ManualTransactionSerializer(data={
            'account_id':       data.get('account_id'),
            'transaction_type': data.get('transaction_type', 'EXPENSE'),
            'category':         data.get('category', 'OTHER'),
            'amount':           data.get('amount'),
            'description':      data.get('description', ''),
        })
        if not serializer.is_valid():
            return Response(
                {'error': 'بيانات غير صالحة.', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vdata  = serializer.validated_data
        amount = Decimal(str(vdata['amount']))

        if amount <= 0:
            return Response(
                {'error': 'المبلغ يجب أن يكون أكبر من صفر.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            account = TreasuryAccount.objects.get(
                pk=vdata['account_id'], is_active=True
            )
        except TreasuryAccount.DoesNotExist:
            return Response(
                {'error': 'الحساب غير موجود أو غير نشط.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        from django.db import transaction as db_tx
        with db_tx.atomic():
            acc = TreasuryAccount.objects.select_for_update().get(pk=account.pk)
            acc.balance -= amount
            acc.save()

            t = TreasuryTransaction.objects.create(
                account          = acc,
                transaction_type = 'EXPENSE',
                category         = vdata['category'],
                amount           = amount,
                balance_after    = acc.balance,
                description      = vdata['description'],
                reference_type   = 'ai_action',
                created_by       = request.user,
                is_auto          = False,
            )

        log_action(
            user         = request.user,
            action       = 'CREATE',
            model_name   = 'TreasuryTransaction',
            object_id    = t.pk,
            object_repr  = f'AI مصروف {amount} ج.م — {vdata["category"]}',
            ip_address   = get_client_ip(request),
            extra_data   = {
                'source':           source,
                'original_command': original_command,
                'intent':           intent,
                'parsed_category':  vdata['category'],
                'parsed_amount':    str(amount),
                'confirmed_by_user': True,
                'transaction_id':   t.pk,
                'parser':           parser_used,
            },
        )

        return Response({
            'status':         'success',
            'transaction_id': t.pk,
            'balance_after':  str(t.balance_after),
            'message':        f'تم تسجيل مصروف {vdata["description"]} بقيمة {amount:,.2f} ج.م بنجاح.',
        }, status=status.HTTP_201_CREATED)