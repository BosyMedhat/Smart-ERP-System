"""
Reports Module URLs
"""
from django.urls import path
from .views import (
    SalesReportView,
    InventoryReportView,
    FinancialReportView,
    SalesReportPDFView,
    InventoryReportPDFView,
    FinancialReportPDFView,
)

urlpatterns = [
    path('sales/', SalesReportView.as_view(), name='sales_report'),
    path('sales/pdf/', SalesReportPDFView.as_view(), name='sales_report_pdf'),
    path('inventory/', InventoryReportView.as_view(), name='inventory_report'),
    path('inventory/pdf/', InventoryReportPDFView.as_view(), name='inventory_report_pdf'),
    path('financial/', FinancialReportView.as_view(), name='financial_report'),
    path('financial/pdf/', FinancialReportPDFView.as_view(), name='financial_report_pdf'),
]
