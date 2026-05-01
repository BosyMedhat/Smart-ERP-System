import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Receipt, Calendar, User, CreditCard, Package } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { formatCurrency } from '../utils/currency';

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
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchSales();
  }, []);

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
      : 'bg-blue-100 text-blue-700';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <div className="text-gray-500">جاري تحميل المبيعات...</div>
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
    <div className="h-full p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">سجل المبيعات</h1>
          <p className="text-gray-500">عرض وتتبع جميع فواتير المبيعات</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="البحث برقم الفاتورة أو اسم العميل..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">العميل</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الكاشير</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجمالي</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الخصم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الصافي</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <div>لا توجد فواتير مطابقة للبحث</div>
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <Receipt size={16} className="text-[#3B82F6]" />
                          {sale.invoice_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          {sale.customer_name || 'عميل نقدي'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.cashier_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(sale.total_amount)}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(sale.discount)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(sale.final_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(sale.payment_type)}`}>
                          {getPaymentTypeLabel(sale.payment_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
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
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500">
              عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredSales.length)} من {filteredSales.length} فاتورة
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={20} />
              </button>
              <span className="px-4 py-2 font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Sale Details Modal */}
        {selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">تفاصيل الفاتورة</h2>
                    <p className="text-gray-500 text-sm mt-1">{selectedSale.invoice_number}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <User size={16} />
                      <span className="text-sm">العميل</span>
                    </div>
                    <div className="font-medium text-gray-800">{selectedSale.customer_name || 'عميل نقدي'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <CreditCard size={16} />
                      <span className="text-sm">طريقة الدفع</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeColor(selectedSale.payment_type)}`}>
                      {getPaymentTypeLabel(selectedSale.payment_type)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">التاريخ</span>
                    </div>
                    <div className="font-medium text-gray-800">{formatDate(selectedSale.created_at)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Receipt size={16} />
                      <span className="text-sm">الكاشير</span>
                    </div>
                    <div className="font-medium text-gray-800">{selectedSale.cashier_name}</div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package size={20} className="text-[#3B82F6]" />
                  الأصناف
                </h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">المنتج</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">الكمية</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">السعر</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedSale.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-800">{item.product_name || `منتج #${item.product}`}</td>
                          <td className="px-4 py-2 text-sm text-gray-700 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-gray-500">لا توجد أصناف</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">الإجمالي:</span>
                    <span className="font-medium">{formatCurrency(selectedSale.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">الخصم:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">الضريبة:</span>
                    <span className="font-medium text-blue-600">+{formatCurrency(selectedSale.tax_amount || '0')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-lg font-bold text-gray-800">الصافي النهائي:</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(selectedSale.final_amount)}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
