import os
import django
import random
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

# إعداد بيئة دجانغو
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from inventory.models import (
    Product, Supplier, Customer, SalesRepresentative, 
    Invoice, Treasury, StockMovement, Expense
)
from django.contrib.auth.models import User

def seed_data():
    print("Starting Final Integration Seeding...")
    
    # Ensure media directory exists
    os.makedirs(os.path.join(os.getcwd(), 'media', 'products'), exist_ok=True)

    # 1. Clear existing data (Optional)
    # Treasury.objects.all().delete()
    # Invoice.objects.all().delete()
    # Product.objects.all().delete()

    # 2. Get or Create Superuser
    user, _ = User.objects.get_or_create(username='admin', defaults={'is_superuser': True, 'is_staff': True})
    user.set_password('admin123')
    user.save()

    # 3. Create Suppliers
    suppliers = []
    for name in ["Dell Egypt", "Samsung Global", "Apple Distribution", "HP Middle East"]:
        sup, _ = Supplier.objects.get_or_create(name=name, defaults={'phone': '0123456789', 'company': name})
        suppliers.append(sup)

    # 4. Create Customers
    customers = []
    for name in ["أحمد علي", "شركة النور", "محل الأمل", "فاطمة محمد"]:
        cust, _ = Customer.objects.get_or_create(name=name, defaults={'phone': f'010{random.randint(1000,9999)}44'})
        customers.append(cust)

    # 5. Create Sales Representatives
    reps = []
    rep_names = [("أحمد محمود", "011223344"), ("سارة حسن", "01556677"), ("محمد علي", "010998877")]
    for name, phone in rep_names:
        rep, _ = SalesRepresentative.objects.get_or_create(
            name=name, 
            defaults={'phone': phone, 'target_sales': 150000, 'commission_rate': 3.0}
        )
        reps.append(rep)

    # 6. Create Products with Categories and Mock Image Paths
    products_data = [
        ("Laptop Dell G15", "Gaming", 25000, 32000, "laptop_dell.jpg"),
        ("iPhone 15 Pro", "Mobiles", 45000, 55000, "iphone15.jpg"),
        ("Samsung S24 Ultra", "Mobiles", 40000, 48000, "s24.jpg"),
        ("HP Monitor 27\"", "Accessories", 5000, 7500, "monitor.jpg"),
        ("Logitech Mouse", "Accessories", 800, 1200, "mouse.jpg"),
        ("Sony Headset", "Audio", 3000, 4500, "headset.jpg"),
    ]

    for name, cat, cost, retail, img in products_data:
        p, _ = Product.objects.update_or_create(
            sku=f"SKU-{random.randint(1000, 9999)}",
            defaults={
                'name': name,
                'category': cat,
                'cost_price': Decimal(cost),
                'retail_price': Decimal(retail),
                'unit': 'قطعة',
                'current_stock': random.randint(10, 50),
                'min_stock_level': 5,
                # Note: Not actually uploading files here, just setting the field for UI demo
                'image': f'products/{img}' 
            }
        )

    # 7. Create Historical Sales (Last 7 Days)
    all_products = list(Product.objects.all())
    for i in range(7):
        date = timezone.now() - timedelta(days=i)
        # Create 2-4 invoices per day
        for _ in range(random.randint(2, 4)):
            total = random.randint(5000, 25000)
            inv = Invoice.objects.create(
                invoice_number=f"INV-{date.strftime('%Y%m%d')}-{random.randint(100, 999)}",
                customer=random.choice(customers),
                representative=random.choice(reps),
                total=Decimal(total),
                tax_amount=Decimal(total * 0.14),
                payment_type='CASH'
            )
            inv.created_at = date
            inv.save()

            # Log to Treasury
            Treasury.objects.create(
                transaction_type='دخل',
                amount=Decimal(total),
                reason=f"مبيعات فاتورة: {inv.invoice_number}",
                date=date
            )

    # 8. Create some Expenses
    for i in range(3):
        Expense.objects.create(
            type=["إيجار", "كهرباء", "صيانة"][i],
            amount=Decimal(random.randint(500, 3000)),
            category='other',
            notes="مصروف دوري"
        )
        # Deduct from treasury
        Treasury.objects.create(
            transaction_type='خرج',
            amount=Decimal(random.randint(500, 3000)),
            reason=f"صرف مصروف دوري",
        )

    print("Seeding Completed Successfully! Your Dashboard is now alive.")

if __name__ == "__main__":
    seed_data()
