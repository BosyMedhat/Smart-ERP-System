#!/usr/bin/env python
"""Seed sample products for demo"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from inventory.models import Product

products = [
    {'name': 'كوكاكولا 250ml', 'sku': 'COK-250', 'cost_price': 5.00, 'retail_price': 7.00, 'current_stock': 100},
    {'name': 'بيبسي 250ml', 'sku': 'PEP-250', 'cost_price': 5.00, 'retail_price': 7.00, 'current_stock': 80},
    {'name': 'ماء معدني 600ml', 'sku': 'WAT-600', 'cost_price': 2.00, 'retail_price': 3.00, 'current_stock': 200},
    {'name': 'شيبسي كبير', 'sku': 'CHI-LRG', 'cost_price': 7.00, 'retail_price': 10.00, 'current_stock': 50},
    {'name': 'شوكولاتة كيت كات', 'sku': 'KIT-KAT', 'cost_price': 10.00, 'retail_price': 15.00, 'current_stock': 60},
    {'name': 'عصير برتقال 1L', 'sku': 'JUI-ORA-1L', 'cost_price': 15.00, 'retail_price': 20.00, 'current_stock': 40},
    {'name': 'بسكويت أوريو', 'sku': 'OREO', 'cost_price': 8.00, 'retail_price': 12.00, 'current_stock': 75},
    {'name': 'علبة تونة', 'sku': 'TUNA', 'cost_price': 12.00, 'retail_price': 18.00, 'current_stock': 30},
]

count = 0
for p in products:
    obj, created = Product.objects.get_or_create(
        sku=p['sku'],
        defaults={
            'name': p['name'],
            'cost_price': p['cost_price'],
            'retail_price': p['retail_price'],
            'current_stock': p['current_stock'],
        }
    )
    if created:
        count += 1
        print(f'Created: {p["name"]}')
    else:
        print(f'Exists: {p["name"]}')

print(f'\nTotal products in DB: {Product.objects.count()}')
print(f'Newly added: {count}')
