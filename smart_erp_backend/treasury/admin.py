from django.contrib import admin
from .models import TreasuryAccount, TreasuryTransaction


@admin.register(TreasuryAccount)
class TreasuryAccountAdmin(admin.ModelAdmin):
    list_display  = ['display_name', 'name', 'balance', 'is_active']
    list_filter   = ['is_active']
    readonly_fields = ['balance', 'created_at']


@admin.register(TreasuryTransaction)
class TreasuryTransactionAdmin(admin.ModelAdmin):
    list_display  = ['created_at', 'account', 'transaction_type',
                     'category', 'amount', 'balance_after', 'is_auto']
    list_filter   = ['transaction_type', 'category', 'account', 'is_auto']
    readonly_fields = ['balance_after', 'created_at', 'is_auto']
    search_fields = ['description', 'reference_type']
    date_hierarchy = 'created_at'
