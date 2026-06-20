import { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Receipt, Calendar, User, CreditCard, Package, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';

interface StoreSettings {
  store_name: string;
  system_name: string;
  phone: string;
  email: string;
  address: string;
  invoice_notes: string;
  show_tax_on_invoice: boolean;
}

interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer: number | null;
  customer_name: string;
  cashier_name: string;
  total_amount: string;
  discount: string;
  tax_amount: string;
  final_amount: string;
  payment_type: 'cash' | 'credit';
  created_at: string;
  notes: string;
  items: SaleItem[];
}

export function SalesHistory() {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const itemsPerPage = 20;
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSales();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings/1/');
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sales/');
      setSales(response.data);
    } catch (err) {
      setError('تعذر تحميل بيانات المبيعات');
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentTypeLabel = (type: string) => {
    return type === 'cash' ? 'كاش' : 'آجل';
  };

  const getPaymentTypeColor = (type: string) => {
    return type === 'cash' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-amber-100 text-amber-700';
  };

  const handlePrint = () => {
    if (!selectedSale || !settings) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const showTax = settings.show_tax_on_invoice !== false; // default to true if not set
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>فاتورة ${selectedSale.invoice_number}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .invoice-title { font-size: 18px; margin: 10px 0; }
          .details { margin-bottom: 20px; }
          .details-row { display: flex; justify-content: space-between; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
          th { background: #f5f5f5; }
          .totals { margin-top: 20px; border-top: 2px solid #333; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .final { font-size: 18px; font-weight: bold; color: #2e7d32; }
          .notes { margin-top: 20px; padding: 10px; background: #fffde7; border: 1px solid #f9a825; text-align: center; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${settings.store_name || settings.system_name || 'Smart ERP'}</div>
          ${settings.phone ? `<div>هاتف: ${settings.phone}</div>` : ''}
          ${settings.address ? `<div>العنوان: ${settings.address}</div>` : ''}
          <div class="invoice-title">فاتورة مبيعات - ${selectedSale.invoice_number}</div>
        </div>
        
        <div class="details">
          <div class="details-row"><span>التاريخ:</span><span>${formatDate(selectedSale.created_at)}</span></div>
          <div class="details-row"><span>العميل:</span><span>${selectedSale.customer_name || 'عميل نقدي'}</span></div>
          <div class="details-row"><span>الكاشير:</span><span>${selectedSale.cashier_name}</span></div>
          <div class="details-row"><span>طريقة الدفع:</span><span>${getPaymentTypeLabel(selectedSale.payment_type)}</span></div>
        </div>
        
        <table>
          <thead>
            <tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>
            ${selectedSale.items?.map(item => `
              <tr>
                <td>${item.product_name || 'منتج'}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">لا توجد أصناف</td></tr>'}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row"><span>الإجمالي:</span><span>${formatCurrency(selectedSale.total_amount)}</span></div>
          <div class="total-row"><span>الخصم:</span><span>-${formatCurrency(selectedSale.discount)}</span></div>
          ${showTax ? `<div class="total-row"><span>الضريبة:</span><span>+${formatCurrency(selectedSale.tax_amount || '0')}</span></div>` : ''}
          <div class="total-row final"><span>الصافي النهائي:</span><span>${formatCurrency(selectedSale.final_amount)}</span></div>
        </div>
        
        ${settings.invoice_notes ? `<div class="notes"><strong>ملاحظات:</strong> ${settings.invoice_notes}</div>` : ''}
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">طباعة الفاتورة</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <div className="text-4xl mb-2">⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-card-foreground mb-2">{t('sales.title')}</h1>
          <p className="text-muted-foreground">عرض وتتبع جميع فواتير المبيعات</p>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl shadow-sm p-4 mb-6 border border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="البحث برقم الفاتورة أو اسم العميل..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pr-10 pl-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-background text-foreground"
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-6 border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{t('sales.invoiceNumber')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{t('sales.customer')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{t('sales.cashier')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{t('common.total')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الخصم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الصافي</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{t('common.date')}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="text-4xl mb-2">📋</div>
                      <div>{t('common.noResults')}</div>
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-card-foreground">
                        <div className="flex items-center gap-2">
                          <Receipt size={16} className="text-[#3B82F6]" />
                          {sale.invoice_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-muted-foreground" />
                          {sale.customer_name || 'عميل نقدي'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{sale.cashier_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(sale.total_amount)}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(sale.discount)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(sale.final_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(sale.payment_type)}`}>
                          {getPaymentTypeLabel(sale.payment_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-muted-foreground" />
                          {formatDate(sale.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="text-[#3B82F6] hover:text-[#2563EB] text-sm font-medium"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-card rounded-xl shadow-sm p-4 border border-border">
            <div className="text-sm text-muted-foreground">
              عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredSales.length)} من {filteredSales.length} فاتورة
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-input disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                <ChevronRight size={20} />
              </button>
              <span className="px-4 py-2 font-medium text-card-foreground">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-input disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Sale Details Modal */}
        {selectedSale && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-card-foreground">تفاصيل الفاتورة</h2>
                    <p className="text-muted-foreground text-sm mt-1">{selectedSale.invoice_number}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <span className="text-2xl text-card-foreground">&times;</span>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <User size={16} />
                      <span className="text-sm">{t('sales.customer')}</span>
                    </div>
                    <div className="font-medium text-card-foreground">{selectedSale.customer_name || 'عميل نقدي'}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CreditCard size={16} />
                      <span className="text-sm">{t('sales.paymentType')}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(selectedSale.payment_type)}`}>
                      {getPaymentTypeLabel(selectedSale.payment_type)}
                    </span>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">{t('common.date')}</span>
                    </div>
                    <div className="font-medium text-card-foreground">{formatDate(selectedSale.created_at)}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Receipt size={16} />
                      <span className="text-sm">{t('sales.cashier')}</span>
                    </div>
                    <div className="font-medium text-card-foreground">{selectedSale.cashier_name}</div>
                  </div>
                </div>

                <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  <Package size={20} className="text-[#3B82F6]" />
                  الأصناف
                </h3>
                <div className="bg-muted rounded-lg overflow-hidden border border-border">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">المنتج</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">الكمية</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">السعر</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedSale.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-card-foreground">{item.product_name || `منتج #${item.product}`}</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-sm font-medium text-card-foreground">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">لا توجد أصناف</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">{t('common.total')}:</span>
                    <span className="font-medium text-card-foreground">{formatCurrency(selectedSale.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">الخصم:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                  {/* Tax - conditional based on show_tax_on_invoice setting (Phase 5) */}
                  {settings?.show_tax_on_invoice !== false && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">الضريبة:</span>
                      <span className="font-medium text-blue-600">+{formatCurrency(selectedSale.tax_amount || '0')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-lg font-bold text-card-foreground">الصافي النهائي:</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(selectedSale.final_amount)}</span>
                  </div>
                </div>
              </div>
              {/* Invoice Notes from StoreSettings */}
              {settings?.invoice_notes && (
                <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100">
                  <p className="text-sm text-yellow-800 text-center">
                    <span className="font-semibold">ملاحظات: </span>
                    {settings.invoice_notes}
                  </p>
                </div>
              )}
              
              <div className="p-6 border-t border-border bg-muted flex gap-3">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors"
                >
                  إغلاق
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Printer size={18} />
                  طباعة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
