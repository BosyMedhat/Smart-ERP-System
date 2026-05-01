import { useState, useEffect } from 'react';
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
  CheckCircle
} from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';

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
  total_tax_collected: number;
  total_discount_given: number;
  net_profit_estimate: number;
  daily_cash_flow: Array<{
    date: string;
    cash_in: number;
    credit_in: number;
    total: number;
  }>;
  payment_split: {
    cash_percentage: number;
    credit_percentage: number;
  };
}

type ReportType = 'sales' | 'inventory' | 'financial';

export function Reports() {
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
      const response = await apiClient.get(`/reports/sales/?from_date=${fromDate}&to_date=${toDate}`);
      setSalesData(response.data);
    } catch (error) {
      console.error('Error fetching sales report:', error);
      alert('حدث خطأ أثناء جلب تقرير المبيعات');
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch Inventory Report
  const fetchInventoryReport = async () => {
    try {
      setInventoryLoading(true);
      const response = await apiClient.get('/reports/inventory/');
      setInventoryData(response.data);
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      alert('حدث خطأ أثناء جلب تقرير المخزون');
    } finally {
      setInventoryLoading(false);
    }
  };

  // Fetch Financial Report
  const fetchFinancialReport = async () => {
    if (!fromDate || !toDate) return;
    
    try {
      setFinancialLoading(true);
      const response = await apiClient.get(`/reports/financial/?from_date=${fromDate}&to_date=${toDate}`);
      setFinancialData(response.data);
    } catch (error) {
      console.error('Error fetching financial report:', error);
      alert('حدث خطأ أثناء جلب التقرير المالي');
    } finally {
      setFinancialLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = async (endpoint: string, filename: string) => {
    try {
      const response = await apiClient.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('حدث خطأ أثناء تحميل PDF');
    }
  };

  // Fetch report when tab changes or on initial load
  useEffect(() => {
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
    color 
  }: { 
    title: string; 
    value: string; 
    icon: any; 
    color: string 
  }) => (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Date Range Picker Component
  const DateRangePicker = ({ show = true }: { show?: boolean }) => {
    if (!show) return null;
    return (
      <div className="flex flex-wrap gap-4 items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <span className="text-slate-300">من:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300">إلى:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            if (activeTab === 'sales') fetchSalesReport();
            else if (activeTab === 'financial') fetchFinancialReport();
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (!salesData) {
      return (
        <div className="text-center py-12 text-slate-400">
          اختر نطاق تاريخ واضغط "عرض التقرير"
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="إجمالي الفواتير"
            value={salesData.total_invoices.toString()}
            icon={FileText}
            color="bg-blue-500"
          />
          <SummaryCard
            title="إجمالي الإيرادات"
            value={formatCurrency(salesData.total_revenue)}
            icon={TrendingUp}
            color="bg-green-500"
          />
          <SummaryCard
            title="صافي الإيرادات"
            value={formatCurrency(salesData.net_revenue)}
            icon={DollarSign}
            color="bg-indigo-500"
          />
          <SummaryCard
            title="الخصومات"
            value={formatCurrency(salesData.total_discount)}
            icon={CheckCircle}
            color="bg-amber-500"
          />
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              أفضل المنتجات مبيعاً
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right py-2 text-slate-400">المنتج</th>
                    <th className="text-center py-2 text-slate-400">الكمية</th>
                    <th className="text-left py-2 text-slate-400">الإيرادات</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.top_products.slice(0, 5).map((p, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2">{p.product_name}</td>
                      <td className="text-center py-2">{p.quantity_sold}</td>
                      <td className="text-left py-2">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Cashiers */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              أفضل الكاشيرين
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right py-2 text-slate-400">الكاشير</th>
                    <th className="text-center py-2 text-slate-400">الفواتير</th>
                    <th className="text-left py-2 text-slate-400">الإيرادات</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.top_cashiers.slice(0, 5).map((c, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2">{c.cashier_name}</td>
                      <td className="text-center py-2">{c.invoices_count}</td>
                      <td className="text-left py-2">{c.revenue.toFixed(2)} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">التفصيل اليومي</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-right py-2 text-slate-400">التاريخ</th>
                  <th className="text-center py-2 text-slate-400">الفواتير</th>
                  <th className="text-left py-2 text-slate-400">الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {salesData.daily_breakdown.map((d, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-2">{d.date}</td>
                    <td className="text-center py-2">{d.invoices}</td>
                    <td className="text-left py-2">{d.revenue.toFixed(2)} ج.م</td>
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (!inventoryData) {
      return (
        <div className="text-center py-12 text-slate-400">
          جاري تحميل التقرير...
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="إجمالي المنتجات"
            value={inventoryData.total_products.toString()}
            icon={Package}
            color="bg-blue-500"
          />
          <SummaryCard
            title="قيمة المخزون"
            value={formatCurrency(inventoryData.stock_value)}
            icon={DollarSign}
            color="bg-green-500"
          />
          <SummaryCard
            title="منخفضة المخزون"
            value={inventoryData.low_stock_products.length.toString()}
            icon={AlertTriangle}
            color="bg-amber-500"
          />
          <SummaryCard
            title="نفدت من المخزون"
            value={inventoryData.out_of_stock.length.toString()}
            icon={AlertTriangle}
            color="bg-red-500"
          />
        </div>

        {/* Low Stock Table */}
        {inventoryData.low_stock_products.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              تنبيهات المخزون المنخفض
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right py-2 text-slate-400">المنتج</th>
                    <th className="text-center py-2 text-slate-400">المخزون الحالي</th>
                    <th className="text-center py-2 text-slate-400">الحد الأدنى</th>
                    <th className="text-left py-2 text-slate-400">النقص</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.low_stock_products.slice(0, 10).map((p, i) => (
                    <tr 
                      key={i} 
                      className={`border-b border-slate-700/50 ${
                        p.current_stock === 0 ? 'bg-red-500/10' : 'bg-amber-500/10'
                      }`}
                    >
                      <td className="py-2">{p.name}</td>
                      <td className="text-center py-2">{p.current_stock}</td>
                      <td className="text-center py-2">{p.min_stock_level}</td>
                      <td className="text-left py-2 text-red-400">{p.shortage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Selling Products */}
        {inventoryData.top_selling_products.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              أفضل المنتجات مبيعاً
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right py-2 text-slate-400">المنتج</th>
                    <th className="text-center py-2 text-slate-400">الكمية المباعة</th>
                    <th className="text-left py-2 text-slate-400">الإيرادات</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.top_selling_products.slice(0, 10).map((p, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2">{p.product_name}</td>
                      <td className="text-center py-2">{p.quantity_sold}</td>
                      <td className="text-left py-2">{formatCurrency(p.revenue)}</td>
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (!financialData) {
      return (
        <div className="text-center py-12 text-slate-400">
          اختر نطاق تاريخ واضغط "عرض التقرير"
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="إجمالي الإيرادات"
            value={formatCurrency(financialData.total_revenue)}
            icon={DollarSign}
            color="bg-green-500"
          />
          <SummaryCard
            title="إيرادات الكاش"
            value={formatCurrency(financialData.cash_revenue)}
            icon={CheckCircle}
            color="bg-blue-500"
          />
          <SummaryCard
            title="إيرادات الآجل"
            value={formatCurrency(financialData.credit_revenue)}
            icon={FileText}
            color="bg-amber-500"
          />
          <SummaryCard
            title="صافي الربح المقدر"
            value={formatCurrency(financialData.net_profit_estimate)}
            icon={TrendingUp}
            color="bg-indigo-500"
          />
        </div>

        {/* Payment Split Visual */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">توزيع طرق الدفع</h3>
          <div className="space-y-4">
            {/* Cash Bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">كاش</span>
                <span className="text-sm text-green-400">{financialData.payment_split.cash_percentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${financialData.payment_split.cash_percentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Credit Bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-300">آجل</span>
                <span className="text-sm text-amber-400">{financialData.payment_split.credit_percentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div 
                  className="bg-amber-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${financialData.payment_split.credit_percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Cash Flow */}
        {financialData.daily_cash_flow.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4">التدفق النقدي اليومي</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right py-2 text-slate-400">التاريخ</th>
                    <th className="text-center py-2 text-slate-400">كاش</th>
                    <th className="text-center py-2 text-slate-400">آجل</th>
                    <th className="text-left py-2 text-slate-400">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {financialData.daily_cash_flow.map((d, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2">{d.date}</td>
                      <td className="text-center py-2 text-green-400">{d.cash_in.toFixed(2)}</td>
                      <td className="text-center py-2 text-amber-400">{d.credit_in.toFixed(2)}</td>
                      <td className="text-left py-2">{formatCurrency(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tax & Discount Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h4 className="text-slate-400 text-sm mb-1">إجمالي الضرائب المحصلة</h4>
            <p className="text-2xl font-bold">{formatCurrency(financialData.total_tax_collected)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h4 className="text-slate-400 text-sm mb-1">إجمالي الخصومات</h4>
            <p className="text-2xl font-bold">{formatCurrency(financialData.total_discount_given)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-500" />
          التقارير
        </h1>
        
        {/* PDF Download Button */}
        <button
          onClick={() => {
            if (activeTab === 'sales') {
              downloadPDF(`/reports/sales/pdf/?from_date=${fromDate}&to_date=${toDate}`, `sales_report_${fromDate}_to_${toDate}.pdf`);
            } else if (activeTab === 'inventory') {
              downloadPDF('/reports/inventory/pdf/', 'inventory_report.pdf');
            } else if (activeTab === 'financial') {
              downloadPDF(`/reports/financial/pdf/?from_date=${fromDate}&to_date=${toDate}`, `financial_report_${fromDate}_to_${toDate}.pdf`);
            }
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          تصدير PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${
            activeTab === 'sales'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            تقارير المبيعات
          </span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${
            activeTab === 'inventory'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            تقارير المخزون
          </span>
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${
            activeTab === 'financial'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            التقارير المالية
          </span>
        </button>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker show={activeTab !== 'inventory'} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'sales' && <SalesReportTab />}
        {activeTab === 'inventory' && <InventoryReportTab />}
        {activeTab === 'financial' && <FinancialReportTab />}
      </div>
    </div>
  );
}

export default Reports;
