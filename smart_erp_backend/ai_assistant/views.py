from django.http import JsonResponse
from langchain_ollama import OllamaLLM
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import models
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from inventory.models import Product, Invoice, Expense, Employee, Customer, StockMovement

@api_view(['POST'])
@permission_classes([AllowAny])
def ask_ai(request):
    user_query = request.data.get('query', '')
    print(f"\n>>> [AI_ASSISTANT] استلمت طلب جديد! جاري التفكير...\nالسؤال: {user_query}\n")
    
    # جلب إحصائيات حقيقية من قاعدة البيانات
    total_products = Product.objects.count()
    low_stock_products = Product.objects.filter(current_stock__lte=models.F('min_stock_level')).count()
    total_sales = Invoice.objects.aggregate(total=Sum('total'))['total'] or 0
    total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
    total_employees = Employee.objects.count()
    total_customers = Customer.objects.count()

    # إنشاء بيانات الرسوم البيانية (Charts Validation) موزعة بالتاريخ لأخر 7 أيام
    seven_days_ago = timezone.now() - timedelta(days=7)
    daily_sales_qs = Invoice.objects.filter(created_at__gte=seven_days_ago) \
        .annotate(date_only=TruncDate('created_at')) \
        .values('date_only') \
        .annotate(daily_total=Sum('total')) \
        .order_by('date_only')
    
    chart_data = []
    sales_trend_str = "يوميات المبيعات آخر 7 أيام:\n"
    for d in daily_sales_qs:
        date_str = str(d['date_only'])
        val = float(d['daily_total'])
        chart_data.append({"month": date_str, "actual": val, "forecast": None})
        sales_trend_str += f"  - التاريخ: {date_str} -> المبيعات: {val} ريال\n"
    
    # جلب المنتجات الحرجة (الكمية أقل من 5) لإعطائها أولوية في ذكاء النظام
    critical_products = Product.objects.filter(current_stock__lt=5)
    critical_info = ""
    if critical_products.exists():
        critical_info = "🚨 تنبيه حرِج بخصوص المخزون (أعطِ هذا المؤشر أولوية ومقترحات سريعة):\n"
        for cp in critical_products:
            if cp.current_stock == 0:
                critical_info += f"  - ❌ [نفذ تماماً]: {cp.name}\n"
            else:
                critical_info += f"  - ⚠️ [قارب على النفاذ]: {cp.name} (المتبقي: {cp.current_stock} قطعة)\n"
    else:
        critical_info = "✅ حالة الكميات للمنتجات مستقرة حالياً ولا توجد نواقص طارئة."

    # جلب آخر حركات المخزن (SALE)
    recent_sales = StockMovement.objects.filter(type='SALE').order_by('-created_at')[:5]
    sales_info = ""
    for sale in recent_sales:
        sales_info += f"- منتج: {sale.product.name}, كمية: {sale.quantity}\n"

    context_str = f"""
    الإحصائيات الحالية للنظام:
    - إجمالي المنتجات: {total_products}
    - منتجات تحت حد الطلب: {low_stock_products}
    - إجمالي المبيعات: {total_sales} ريال
    - إجمالي المصروفات: {total_expenses} ريال
    - عدد الموظفين: {total_employees}
    - عدد العملاء: {total_customers}

    {sales_trend_str}

    {critical_info}

    آخر عمليات البيع الحية:
    {sales_info}
    """

    prompt = f"""
    أنت مساعد ذكي لنظام ERP متطور. إليك ملخص البيانات الحقيقية من النظام:
    {context_str}
    
    المدير يسألك: {user_query}
    
    التعليمات:
    1. أجب بالعربي بلهجة احترافية واضحة ومباشرة.
    2. إذا سألك المستخدم عن "النواقص" أو "المخزون الداخلي"، تفقد فوراً قسم (تنبيه حرج بخصوص المخزون) واذكر المنتجات الناقصة بوضوح.
    3. إذا سألك عن "المبيعات" أو "الرسم البياني"، اقرأ بيانات (يوميات المبيعات) وحللها له.
    4. اقترح توصيات للطلب المبكر أو تحسين الإيرادات إذا لاحظت تراجعاً أو ثباتاً.
    """

    try:
        llm = OllamaLLM(model="llama3", base_url="http://127.0.0.1:11434") 
        response = llm.invoke(prompt)
        return JsonResponse({'status': 'success', 'response': response, 'chart_data': chart_data})
    except Exception as e:
        print(f"Ollama Error: {str(e)}") 
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)