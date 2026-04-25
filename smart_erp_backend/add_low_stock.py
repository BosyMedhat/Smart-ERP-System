#!/usr/bin/env python
"""Add low-stock products to database"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from inventory.models import Product

low_stock_products = [
    {'name': 'قهوة عربية', 'cost_price': 25.00, 'retail_price': 45.00, 'wholesale_price': 30.00, 'current_stock': 3, 'min_stock_level': 10},
    {'name': 'شاي أخضر', 'cost_price': 10.00, 'retail_price': 25.00, 'wholesale_price': 15.00, 'current_stock': 2, 'min_stock_level': 15},
    {'name': 'سكر ناعم', 'cost_price': 8.00, 'retail_price': 18.00, 'wholesale_price': 12.00, 'current_stock': 4, 'min_stock_level': 20},
    {'name': 'زيت ذرة', 'cost_price': 35.00, 'retail_price': 55.00, 'wholesale_price': 40.00, 'current_stock': 1, 'min_stock_level': 10},
    {'name': 'أرز بسمتي', 'cost_price': 45.00, 'retail_price': 70.00, 'wholesale_price': 50.00, 'current_stock': 0, 'min_stock_level': 25},
]

import random

for idx, p in enumerate(low_stock_products, 1):
    # Generate unique SKU
    sku = f"LOW{random.randint(10000, 99999)}{idx}"
    product, created = Product.objects.get_or_create(
        name=p['name'],
        defaults={
            'sku': sku,
            'cost_price': p['cost_price'],
            'retail_price': p['retail_price'],
            'wholesale_price': p['wholesale_price'],
            'current_stock': p['current_stock'],
            'min_stock_level': p['min_stock_level'],
        }
    )
    if not created:
        product.cost_price = p['cost_price']
        product.current_stock = p['current_stock']
        product.min_stock_level = p['min_stock_level']
        product.save()
    print(f"{'Created' if created else 'Updated'}: {p['name']} — stock: {p['current_stock']}")

print("Done. Low stock products:", Product.objects.filter(current_stock__lte=10).count())
