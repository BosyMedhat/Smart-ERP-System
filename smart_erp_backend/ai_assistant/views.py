from django.http import JsonResponse
from langchain_ollama import OllamaLLM
from rest_framework.decorators import api_view

@api_view(['POST'])
def ask_ai(request):
    user_query = request.data.get('query', '')
    context_data = request.data.get('context_data', [])

    # تنسيق البيانات عشان يفهمها الموديل
    context_str = "العمليات المشبوهة الحالية:\n"
    for item in context_data:
        context_str += f"- الموظف: {item['employee']}, العملية: {item['operationType']}, القيمة: {item['value']}\n"

    prompt = f"""
    أنت مساعد ذكي لنظام ERP. إليك البيانات:
    {context_str}
    المدير جمال يسألك: {user_query}
    أجب بالعربي بلهجة احترافية.
    """

    try:
        # التعديل الجوهري هنا: نستخدم localhost لأن البورت معمول له Mapping
        llm = OllamaLLM(model="llama3", base_url="http://127.0.0.1:11434") 
        
        response = llm.invoke(prompt)
        return JsonResponse({'status': 'success', 'response': response})
    except Exception as e:
        # السطر ده هيطبع لنا الخطأ بالظبط في الـ Terminal لو حصلت مشكلة
        print(f"Ollama Error: {str(e)}") 
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)