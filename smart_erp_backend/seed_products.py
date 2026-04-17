import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from inventory.models import Product

def seed_data():
    Product.objects.all().delete()
    print("Deleted all old products.")

    products = [
        # منتجات متوفرة بكثرة
        {"sku": "111", "name": "شاشة سامسونج 32", "cost_price": 3000, "retail_price": 3500, "current_stock": 50, "min_stock_level": 5},
        {"sku": "222", "name": "كيبورد لاسلكي", "cost_price": 150, "retail_price": 200, "current_stock": 100, "min_stock_level": 10},
        
        # منتجات قاربت على النفاذ (Critical)
        {"sku": "333", "name": "لابتوب HP", "cost_price": 12000, "retail_price": 13500, "current_stock": 2, "min_stock_level": 5},
        {"sku": "444", "name": "ماوس جيمنج", "cost_price": 300, "retail_price": 400, "current_stock": 1, "min_stock_level": 3},
        
        # منتج نفذ تماماً (Out of Stock)
        {"sku": "555", "name": "سماعة بلوتوث", "cost_price": 500, "retail_price": 700, "current_stock": 0, "min_stock_level": 5},
    ]

    for p in products:
        Product.objects.create(**p)
        print(f"Added product: {p['sku']} with stock: {p['current_stock']}")

if __name__ == "__main__":
    seed_data()
