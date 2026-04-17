import os
import django
import sys
from django.utils import timezone

# إضافة المسار الحالي لـ sys.path عشان django يعرف الـ settings
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import SystemAnomaly

def seed_anomalies():
    print("Starting Anomaly Seeding...")
    
    # التأكد من وجود مستخدمين
    cashier = User.objects.filter(username__icontains='cashier').first() or User.objects.first()
    admin_user = User.objects.filter(is_superuser=True).first()

    anomalies = [
        {
            "employee": admin_user,
            "employee_name": "أحمد محمود (مدير)",
            "operation_type": "تعديل سعر منتج",
            "old_value": "12,900",
            "new_value": "8,500",
            "reason": "تم تخفيض سعر 'لابتوب HP' بنسبة 35% بدون تصريح مسبق",
            "severity": "medium"
        },
        {
            "employee": cashier,
            "employee_name": "سارة حسن (كاشير)",
            "operation_type": "خصم استثنائي",
            "new_value": "4,200",
            "reason": "قيمة الخصم تجاوزت 25% من إجمالي الفاتورة رقم #1059",
            "severity": "high"
        },
        {
            "employee": admin_user,
            "employee_name": "محمد علي (مدير)",
            "operation_type": "حذف فاتورة",
            "new_value": "3,200",
            "reason": "تم حذف الفاتورة رقم #992 بعد 3 ساعات من إصدارها",
            "severity": "high"
        },
        {
            "employee": cashier,
            "employee_name": "أحمد علي (كاشير)",
            "operation_type": "عملية بيع خارج الدوام",
            "new_value": "1,500",
            "reason": "تمت العملية الساعة 23:45 (خارج ساعات العمل الرسمية)",
            "severity": "low"
        }
    ]

    for data in anomalies:
        SystemAnomaly.objects.create(**data)
        print("Success: Added anomaly record")

    print("Finished Seeding Anomalies!")

if __name__ == "__main__":
    seed_anomalies()
