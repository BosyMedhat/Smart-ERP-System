import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  PieChart,
  CreditCard,
} from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';
import { notify } from '../../lib/notifications';

// Types
interface SalesReport {
  period: { from: string; to: string };
  total_invoices: number;
  total_revenue: number;
  total_discount: number;
  total_tax: number;
  net_revenue: number;
  cash_revenue: number;
  credit_revenue: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  top_cashiers: Array<{
    cashier_name: string;
    invoices_count: number;
    revenue: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    invoices: number;
    revenue: number;
  }>;
}

interface InventoryReport {
  total_products: number;
  stock_value: number;
  low_stock_products: Array<{
    name: string;
    current_stock: number;
    min_stock_level: number;
    shortage: number;
  }>;
  out_of_stock: Array<{
    name: string;
    retail_price: number;
  }>;
  top_selling_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

interface FinancialReport {
  period: { from: string; to: string };
  total_revenue: number;
  cash_revenue: number;
  credit_revenue: number;
  installment_revenue: number;
  total_tax_collected: number;
  total_discount_given: number;
  net_profit_estimate: number;
  daily_cash_flow: Array<{
    date: string;
    cash_in: number;
    credit_in: number;
    total: number;
  }>;
  payment_breakdown: {
    cash: number;
    vodafone_cash: number;
    instapay: number;
    card: number;
    credit: number;
    installment: number;
  };
  payment_split: {
    cash_percentage: number;
    credit_percentage: number;
    installment_percentage: number;
  };
}

type ReportType = 'sales' | 'inventory' | 'financial';

export function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  // Report data states
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);
  const [financialData, setFinancialData] = useState<FinancialReport | null>(null);
  
  // Loading states
  const [salesLoading, setSalesLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Error state
  const [reportError, setReportError] = useState<string | null>(null);

  // Initialize dates on mount
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(firstDayOfMonth.toISOString().split('T')[0]);
  }, []);

  // Fetch Sales Report
  const fetchSalesReport = async () => {
    if (!fromDate || !toDate) return;
    
    try {
      setSalesLoading(true);
      setReportError(null);
      const response = await apiClient.get(`/reports/sales/?from_date=${fromDate}&to_date=${toDate}`);
      setSalesData(response.data);
    } catch (error) {
      console.error('Error fetching sales report:', error);
      setReportError('فشل تحميل تقرير المبيعات — تحقق من تشغيل الخادم');
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch Inventory Report
  const fetchInventoryReport = async () => {
    try {
      setInventoryLoading(true);
      setReportError(null);
      const response = await apiClient.get('/reports/inventory/');
      setInventoryData(response.data);
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      setReportError('فشل تحميل تقرير المخزون — تحقق من تشغيل الخادم');
    } finally {
      setInventoryLoading(false);
    }
  };

  // Fetch Financial Report
  const fetchFinancialReport = async () => {
    if (!fromDate || !toDate) return;
    
    try {
      setFinancialLoading(true);
      setReportError(null);
      const response = await apiClient.get(`/reports/financial/?from_date=${fromDate}&to_date=${toDate}`);
      setFinancialData(response.data);
    } catch (error) {
      console.error('Error fetching financial report:', error);
      setReportError('فشل تحميل التقرير المالي — تحقق من تشغيل الخادم');
    } finally {
      setFinancialLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = async (endpoint: string, filename: string) => {
    try {
      const response = await apiClient.get(endpoint, { 
        responseType: 'blob'
      });
      
      // تحقق إذا Backend أرجع JSON error بدلاً من PDF
      if (response.data.type === 'application/json') {
        const text = await (response.data as Blob).text();
        try {
          const err = JSON.parse(text);
          notify.error('خطأ في إنشاء التقرير', { description: err.error || 'خطأ غير معروف' });
        } catch {
          notify.error('فشل إنشاء التقرير');
        }
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      notify.error('حدث خطأ أثناء تحميل PDF');
    }
  };

  // Fetch report when tab changes or on initial load
  useEffect(() => {
    // Guard: لا تنطلق الـ fetch إذا التواريخ لم تُضبط بعد
    if (activeTab !== 'inventory' && (!fromDate || !toDate)) return;

    if (activeTab === 'sales') {
      fetchSalesReport();
    } else if (activeTab === 'inventory') {
      fetchInventoryReport();
    } else if (activeTab === 'financial') {
      fetchFinancialReport();
    }
  }, [activeTab, fromDate, toDate]);

  // Summary Card Component
  const SummaryCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    icon: any;
    color: string;
  }) => (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  // Date Range Picker Component
  const DateRangePicker = ({ show = true }: { show?: boolean }) => {
    if (!show) return null;
    return (
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border border-border shadow-sm mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-muted-foreground text-sm font-medium">من:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-muted border border-input rounded-lg px-3 py-2 text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">إلى:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-muted border border-input rounded-lg px-3 py-2 text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => {
            if (activeTab === 'sales') fetchSalesReport();
            else if (activeTab === 'financial') fetchFinancialReport();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          <BarChart3 className="w-4 h-4" />
          عرض التقرير
        </button>
      </div>
    );
  };

  // Sales Report Tab
  const SalesReportTab = () => {
    if (salesLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-blue-600"></div>
          <p className="text-muted-foreground text-sm">جاري تحميل التقرير...</p>
        </div>
      );
    }

    if (!salesData) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <BarChart3 className="w-12 h-12 text-gray-300" />
          <p className="text-muted-foreground text-sm">اختر نطاق تاريخ واضغط «عرض التقرير»</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="إجمالي الفواتير" value={salesData.total_invoices.toString()} icon={FileText} color="bg-blue-500" />
          <SummaryCard title={t('reports.totalRevenue')} value={formatCurrency(salesData.total_revenue)} icon={TrendingUp} color="bg-emerald-500" />
          <SummaryCard title="صافي الإيرادات" value={formatCurrency(salesData.net_revenue)} icon={DollarSign} color="bg-violet-500" />
          <SummaryCard title="الخصومات الممنوحة" value={formatCurrency(salesData.total_discount)} icon={CheckCircle} color="bg-amber-500" />
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <div className="p-1.5 bg-violet-500/10 rounded-lg">
                <Package className="w-4 h-4 text-violet-600" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground">أفضل المنتجات مبيعاً</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">المنتج</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الكمية</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الإيرادات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {salesData.top_products.slice(0, 5).map((p, i) => (
                    <tr key={i} className="hover:bg-muted transition-colors">
                      <td className="px-5 py-3 text-card-foreground font-medium">{p.product_name}</td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{p.quantity_sold}</td>
                      <td className="px-5 py-3 text-left text-emerald-600 font-semibold">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Cashiers */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground">أفضل الكاشيرين</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الكاشير</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الفواتير</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الإيرادات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {salesData.top_cashiers.slice(0, 5).map((c, i) => (
                    <tr key={i} className="hover:bg-muted transition-colors">
                      <td className="px-5 py-3 text-card-foreground font-medium">{c.cashier_name}</td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{c.invoices_count}</td>
                      <td className="px-5 py-3 text-left text-emerald-600 font-semibold">{c.revenue.toFixed(2)} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">التفصيل اليومي</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.date')}</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الفواتير</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الإيرادات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salesData.daily_breakdown.map((d, i) => (
                  <tr key={i} className="hover:bg-muted transition-colors">
                    <td className="px-5 py-3 text-card-foreground">{d.date}</td>
                    <td className="px-5 py-3 text-center text-muted-foreground">{d.invoices}</td>
                    <td className="px-5 py-3 text-left text-emerald-600 font-semibold">{d.revenue.toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Inventory Report Tab
  const InventoryReportTab = () => {
    if (inventoryLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-blue-600"></div>
          <p className="text-muted-foreground text-sm">جاري تحميل التقرير...</p>
        </div>
      );
    }

    if (!inventoryData) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-muted-foreground text-sm">جاري تحميل بيانات المخزون...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="إجمالي المنتجات" value={inventoryData.total_products.toString()} icon={Package} color="bg-blue-500" />
          <SummaryCard title="قيمة المخزون" value={formatCurrency(inventoryData.stock_value)} icon={DollarSign} color="bg-emerald-500" />
          <SummaryCard title="منخفضة المخزون" value={inventoryData.low_stock_products.length.toString()} icon={AlertTriangle} color="bg-amber-500" />
          <SummaryCard title="نفدت من المخزون" value={inventoryData.out_of_stock.length.toString()} icon={AlertTriangle} color="bg-red-500" />
        </div>

        {/* Low Stock Table */}
        {inventoryData.low_stock_products.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-amber-800">تنبيهات المخزون المنخفض</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">المنتج</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">المخزون الحالي</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الحد الأدنى</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">النقص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inventoryData.low_stock_products.slice(0, 10).map((p, i) => (
                    <tr
                      key={i}
                      className={p.current_stock === 0 ? 'bg-red-50' : 'bg-amber-50/50 hover:bg-amber-50 transition-colors'}
                    >
                      <td className="px-5 py-3 text-card-foreground font-medium">{p.name}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.current_stock === 0 ? 'bg-red-500/10 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{p.current_stock}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{p.min_stock_level}</td>
                      <td className="px-5 py-3 text-left text-red-600 font-semibold">{p.shortage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Selling Products */}
        {inventoryData.top_selling_products.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-card-foreground">أفضل المنتجات مبيعاً</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">المنتج</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الكمية المباعة</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الإيرادات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inventoryData.top_selling_products.slice(0, 10).map((p, i) => (
                    <tr key={i} className="hover:bg-muted transition-colors">
                      <td className="px-5 py-3 text-card-foreground font-medium">{p.product_name}</td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{p.quantity_sold}</td>
                      <td className="px-5 py-3 text-left text-emerald-600 font-semibold">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Financial Report Tab
  const FinancialReportTab = () => {
    if (financialLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-blue-600"></div>
          <p className="text-muted-foreground text-sm">جاري تحميل التقرير...</p>
        </div>
      );
    }

    if (!financialData) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <DollarSign className="w-12 h-12 text-gray-300" />
          <p className="text-muted-foreground text-sm">اختر نطاق تاريخ واضغط «عرض التقرير»</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title={t('reports.totalRevenue')} value={formatCurrency(financialData.total_revenue)} icon={DollarSign} color="bg-emerald-500" />
          <SummaryCard title="إيرادات الكاش" value={formatCurrency(financialData.cash_revenue)} icon={CheckCircle} color="bg-blue-500" />
          <SummaryCard title="إيرادات الآجل" value={formatCurrency(financialData.credit_revenue)} icon={CreditCard} color="bg-amber-500" />
          <SummaryCard title="صافي الربح المقدر" value={formatCurrency(financialData.net_profit_estimate)} icon={TrendingUp} color="bg-violet-500" />
        </div>

        {/* Payment Split Visual */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-5">توزيع طرق الدفع</h3>
          <div className="space-y-5">
            {/* Cash Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-card-foreground font-medium">كاش</span>
                <span className="text-sm font-bold text-emerald-600">{financialData.payment_split.cash_percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${financialData.payment_split.cash_percentage}%` }}
                />
              </div>
            </div>
            {/* Credit Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-card-foreground font-medium">آجل</span>
                <span className="text-sm font-bold text-amber-600">{financialData.payment_split.credit_percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${financialData.payment_split.credit_percentage}%` }}
                />
              </div>
            </div>
            {/* Installment Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-card-foreground font-medium">تقسيط</span>
                <span className="text-sm font-bold text-violet-600">{financialData.payment_split.installment_percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-violet-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${financialData.payment_split.installment_percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Cash Flow */}
        {financialData.daily_cash_flow.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-card-foreground">التدفق النقدي اليومي</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.date')}</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">كاش</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">آجل</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {financialData.daily_cash_flow.map((d, i) => (
                    <tr key={i} className="hover:bg-muted transition-colors">
                      <td className="px-5 py-3 text-card-foreground">{d.date}</td>
                      <td className="px-5 py-3 text-center text-emerald-600 font-medium">{d.cash_in.toFixed(2)}</td>
                      <td className="px-5 py-3 text-center text-amber-600 font-medium">{d.credit_in.toFixed(2)}</td>
                      <td className="px-5 py-3 text-left text-card-foreground font-semibold">{formatCurrency(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tax & Discount Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">إجمالي الضرائب المحصلة</p>
            <p className="text-2xl font-bold text-card-foreground">{formatCurrency(financialData.total_tax_collected)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">إجمالي الخصومات الممنوحة</p>
            <p className="text-2xl font-bold text-card-foreground">{formatCurrency(financialData.total_discount_given)}</p>
          </div>
        </div>
      </div>
    );
  };

  const tabs: { key: ReportType; label: string; icon: any }[] = [
    { key: 'sales',     label: 'تقارير المبيعات', icon: TrendingUp },
    { key: 'inventory', label: 'تقارير المخزون',  icon: Package },
    { key: 'financial', label: 'التقارير المالية', icon: DollarSign },
  ];

  return (
    <div className="min-h-full bg-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              {t('reports.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل الأداء وعرض البيانات التفصيلية</p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'sales') {
                downloadPDF(`reports/sales/pdf/?from_date=${fromDate}&to_date=${toDate}`, `sales_report_${fromDate}_to_${toDate}.pdf`);
              } else if (activeTab === 'inventory') {
                downloadPDF('reports/inventory/pdf/', 'inventory_report.pdf');
              } else if (activeTab === 'financial') {
                downloadPDF(`reports/financial/pdf/?from_date=${fromDate}&to_date=${toDate}`, `financial_report_${fromDate}_to_${toDate}.pdf`);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-card-foreground hover:bg-muted hover:border-input shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            تصدير PDF
          </button>
        </div>

        {/* Tabs */}
        <div data-demo-id="reports-tabs" className="bg-card rounded-xl border border-border shadow-sm p-1.5 flex gap-1">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                }`}
                style={isActive ? { backgroundColor: 'var(--primary-color)' } : undefined}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Range Picker */}
        <DateRangePicker show={activeTab !== 'inventory'} />

        {/* Error Banner */}
        {reportError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm">{reportError}</span>
            <button
              onClick={() => setReportError(null)}
              className="mr-auto text-red-400 hover:text-red-600 text-lg leading-none"
            >✕</button>
          </div>
        )}

        {/* Tab Content */}
        <div data-demo-id="reports-summary-cards">
          {activeTab === 'sales'     && <SalesReportTab />}
          {activeTab === 'inventory' && <InventoryReportTab />}
          {activeTab === 'financial' && <FinancialReportTab />}
        </div>

      </div>
    </div>
  );
}

export default Reports;

