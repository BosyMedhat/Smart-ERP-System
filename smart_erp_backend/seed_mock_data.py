import os
import django
import random
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from inventory.models import Product, Expense, Employee, Invoice, WorkShift, StockMovement
from django.contrib.auth.models import User

def seed_data():
    print("Cleaning old data...")
    Invoice.objects.all().delete()
    StockMovement.objects.all().delete()
    WorkShift.objects.all().delete()
    Product.objects.all().delete()
    Employee.objects.all().delete()
    Expense.objects.all().delete()

    print("Adding 10 products...")
    products_data = [
        {"sku": "P001", "name": "شاشة سامسونج 32", "cost_price": 3000, "retail_price": 3500, "current_stock": 50, "min_stock_level": 5},
        {"sku": "P002", "name": "كيبورد لاسلكي", "cost_price": 150, "retail_price": 200, "current_stock": 100, "min_stock_level": 10},
        {"sku": "P003", "name": "ماوس جيمنج", "cost_price": 300, "retail_price": 400, "current_stock": 1, "min_stock_level": 5},
        {"sku": "P004", "name": "لابتوب HP", "cost_price": 12000, "retail_price": 13500, "current_stock": 2, "min_stock_level": 5},
        {"sku": "P005", "name": "سماعة بلوتوث", "cost_price": 500, "retail_price": 700, "current_stock": 0, "min_stock_level": 5},
        {"sku": "P006", "name": "طابعة كانون", "cost_price": 2000, "retail_price": 2400, "current_stock": 15, "min_stock_level": 5},
        {"sku": "P007", "name": "كاميرا سوني", "cost_price": 8000, "retail_price": 9000, "current_stock": 3, "min_stock_level": 3},
        {"sku": "P008", "name": "راوتر TP-Link", "cost_price": 400, "retail_price": 500, "current_stock": 30, "min_stock_level": 10},
        {"sku": "P009", "name": "شاحن لابتوب متعدد", "cost_price": 250, "retail_price": 350, "current_stock": 20, "min_stock_level": 5},
        {"sku": "P010", "name": "كابل HDMI", "cost_price": 50, "retail_price": 100, "current_stock": 200, "min_stock_level": 20},
    ]
    created_products = []
    for p in products_data:
        prod = Product.objects.create(**p)
        created_products.append(prod)
    print("Done importing products.")

    print("Adding 5 employees...")
    employees_data = [
        {"name": "أحمد سمير", "position": "كاشير", "baseSalary": 4000, "advances": 500, "incentives": 200, "attendance": "present"},
        {"name": "سارة محمد", "position": "محاسب", "baseSalary": 6000, "advances": 0, "incentives": 500, "attendance": "present"},
        {"name": "مصطفى كمال", "position": "مدير فرع", "baseSalary": 10000, "advances": 0, "incentives": 1500, "attendance": "present"},
        {"name": "هبة علي", "position": "خدمة عملاء", "baseSalary": 3500, "advances": 0, "incentives": 0, "attendance": "absent"},
        {"name": "محمود طارق", "position": "أمين مخزن", "baseSalary": 4500, "advances": 1000, "incentives": 100, "attendance": "late"},
    ]
    for emp in employees_data:
        Employee.objects.create(**emp)
    print("Done importing employees.")

    print("Adding miscellaneous expenses...")
    expenses_data = [
        {"type": "إيجار المعرض", "category": "rent", "amount": 15000, "notes": "إيجار شهر أبريل"},
        {"type": "فاتورة كهرباء", "category": "electricity", "amount": 2000, "notes": "كهرباء المعرض والمخزن"},
        {"type": "صيانة تكييف", "category": "maintenance", "amount": 500, "notes": "صيانة دورية قبل الصيف"},
        {"type": "بوفيه وضيافة", "category": "other", "amount": 300, "notes": "شاي وقهوة للموظفين"},
    ]
    for exp in expenses_data:
        Expense.objects.create(**exp)
    print("Done importing expenses.")

    print("Adding invoices for last 7 days...")
    user = User.objects.first()
    if not user:
        user = User.objects.create_superuser('admin_temp', 'admin@example.com', 'adminpass')
    
    shift = WorkShift.objects.create(user=user, starting_cash=1000)
    
    now = timezone.now()
    for i in range(7):
        target_date = now - timedelta(days=6 - i)  # من 6 أيام مضت وحتى اليوم
        # إنشاء 2-4 فواتير في اليوم
        daily_invoices_count = random.randint(2, 4)
        for j in range(daily_invoices_count):
            inv_total = Decimal(random.randint(500, 5000))
            invoice = Invoice.objects.create(
                invoice_number=f"INV-{target_date.strftime('%Y%m%d')}-{j}",
                shift=shift,
                total=inv_total,
                payment_type="CASH"
            )
            # تحديث تاريخ الإنشاء يدوياً لتجاوز auto_now_add
            Invoice.objects.filter(id=invoice.id).update(created_at=target_date)

            # إنشاء حركة مخزن مرتبطة (StockMovement)
            random_product = random.choice(created_products)
            sm = StockMovement.objects.create(
                product=random_product,
                type='SALE',
                quantity=random.randint(1, 3),
                reason=f"Sale for invoice {invoice.invoice_number}"
            )
            StockMovement.objects.filter(id=sm.id).update(created_at=target_date)

    print("Distributed sales successfully added.")
    print("Test data fully ingested!!")

if __name__ == "__main__":
    seed_data()
