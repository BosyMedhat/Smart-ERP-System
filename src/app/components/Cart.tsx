import { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Printer, X, Loader2, ScanLine } from 'lucide-react';
import { CartItem, Product } from '../App';
import apiClient from '../../api/axiosConfig';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { formatCurrency } from '../utils/currency';

interface CartProps {
  cartItems: CartItem[];
  selectedCustomer: string;
  onCustomerChange: (customer: string) => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearCart: () => void;
  onSaleComplete?: () => void;
  onAddToCart?: (product: Product) => void;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: string;
}

export function Cart({
  cartItems,
  selectedCustomer,
  onCustomerChange,
  discount,
  onDiscountChange,
  onUpdateQuantity,
  onClearCart,
  onSaleComplete,
  onAddToCart,
}: CartProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'vodafone_cash' | 'instapay' | 'card' | 'credit' | 'installment'>('cash');
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [installmentData, setInstallmentData] = useState({
    down_payment: '',
    months_count: '3',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [lastScannedProduct, setLastScannedProduct] = useState<string | null>(null);

  // Barcode scan handler
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!onAddToCart) return;
    
    try {
      const response = await apiClient.get(`/products/barcode/${barcode}/`);
      const product = response.data;
      
      // Map backend product to frontend Product interface
      const mappedProduct: Product = {
        id: String(product.id),
        name: product.name,
        price: parseFloat(product.retail_price || 0),
        retail_price: parseFloat(product.retail_price || 0),
        category: product.category || 'عام',
        image: product.image || `https://placehold.co/400x400/3B82F6/FFFFFF?text=${encodeURIComponent(product.name.substring(0, 10))}`,
        current_stock: parseFloat(product.current_stock || 0),
        sku: product.sku,
      };
      
      onAddToCart(mappedProduct);
      setLastScannedProduct(product.name);
      
      // Clear the success message after 3 seconds
      setTimeout(() => setLastScannedProduct(null), 3000);
    } catch (err) {
      console.error('Barcode scan error:', err);
      alert(`❌ باركود غير موجود: ${barcode}`);
    }
  }, [onAddToCart]);

  // Enable barcode scanner
  const { isScanning } = useBarcodeScanner({ 
    onScan: handleBarcodeScan, 
    enabled: !!onAddToCart 
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiClient.get('/customers/');
        setCustomers(response.data);
      } catch (err) {
        setError('تعذر تحميل بيانات العملاء');
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.14;
  const total = subtotal + tax - discount;
  const finalAmount = total > 0 ? total : 0;

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('السلة فارغة!');
      return;
    }

    // Check if credit is selected without a customer
    if (paymentType === 'credit' && !selectedCustomer) {
      setShowCreditWarning(true);
      return;
    }
    setShowCreditWarning(false);

    try {
      // Validate installment
      if (paymentType === 'installment') {
        if (!selectedCustomer) {
          setShowCreditWarning(true);
          setCheckoutLoading(false);
          return;
        }
        if (!installmentData.down_payment && installmentData.down_payment !== '0') {
          alert('⚠️ برجاء إدخال المقدم (يمكن أن يكون صفر)');
          setCheckoutLoading(false);
          return;
        }
      }

      setCheckoutLoading(true);

      const payload: Record<string, unknown> = {
        customer: selectedCustomer ? parseInt(selectedCustomer) : null,
        total_amount: subtotal,
        discount: discount,
        payment_type: paymentType,
        items: cartItems.map(item => ({
          product: parseInt(item.id),
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        }))
      };

      if (paymentType === 'installment') {
        payload.down_payment = parseFloat(installmentData.down_payment) || 0;
        payload.months_count = parseInt(installmentData.months_count) || 3;
        payload.due_date = installmentData.due_date;
      }

      const res = await apiClient.post('/sales/', payload);
      const paymentMethodNames: Record<string, string> = {
        'cash': 'كاش',
        'vodafone_cash': 'فودافون كاش',
        'instapay': 'انستاباي',
        'card': 'بطاقة بنكية',
        'credit': 'آجل'
      };
      alert(`✅ تم البيع!\nرقم الفاتورة: ${res.data.invoice_number}\nالإجمالي: ${res.data.final_amount} ج.م\nطريقة الدفع: ${paymentMethodNames[paymentType]}`);
      onClearCart();
      if (onSaleComplete) onSaleComplete();
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      if (axiosErr.response?.status === 400) {
        const errMsg = axiosErr.response?.data
          ? JSON.stringify(axiosErr.response.data, null, 2)
          : 'Error in data';
        alert('Error:\n' + errMsg);
      } else {
        alert('Failed to complete sale. Please try again.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="h-full bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
      {(paymentType === 'credit' || paymentType === 'installment') && (
      <div className="p-3 border-b border-gray-200 shrink-0">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          اختيار العميل
        </label>
        {loading && (
          <div className="text-center py-2 text-gray-500 text-sm">جاري تحميل العملاء...</div>
        )}
        {error && (
          <div className="text-center py-2 text-red-500 text-sm">{error}</div>
        )}
        <select
          value={selectedCustomer}
          onChange={(e) => onCustomerChange(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          disabled={loading}
        >
          <option value="">عميل نقدي</option>
          {customers.map((customer) => (
            <option key={customer.id} value={String(customer.id)}>
              {customer.name}
            </option>
          ))}
        </select>
        
        {/* Barcode Scanner Indicator */}
        {onAddToCart && (
          <div className="mt-3 flex items-center gap-2">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isScanning 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <ScanLine size={14} className={isScanning ? 'animate-pulse' : ''} />
              {isScanning ? 'جاري المسح...' : '🔍 جاهز لمسح الباركود'}
            </div>
            {lastScannedProduct && (
              <div className="flex-1 px-2 py-1.5 bg-green-50 border border-green-200 rounded text-xs text-green-700 animate-pulse">
                ✅ تم إضافة: {lastScannedProduct}
              </div>
            )}
          </div>
        )}
      </div>
      )}
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0 basis-0">
        {cartItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">🛒</div>
              <div>السلة فارغة</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-100 rounded-lg p-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm truncate">{item.name}</div>
                    <div className="text-[#3B82F6] font-bold text-xs">{formatCurrency(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 bg-green-100 text-green-600 rounded flex items-center justify-center hover:bg-green-200 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="font-bold text-gray-800 text-sm shrink-0 w-16 text-left">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="border-t border-gray-200 p-3 bg-gray-50 shrink-0">
        <div className="border-t border-gray-300 pt-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">الصافي النهائي</span>
            <span className="text-2xl font-bold text-[#10B981]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Payment Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            طريقة الدفع
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => { setPaymentType('cash'); setShowCreditWarning(false); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'cash'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💵 كاش
            </button>
            <button
              onClick={() => { setPaymentType('vodafone_cash'); setShowCreditWarning(false); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'vodafone_cash'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📱 فودافون كاش
            </button>
            <button
              onClick={() => { setPaymentType('instapay'); setShowCreditWarning(false); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'instapay'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📲 انستاباي
            </button>
            <button
              onClick={() => { setPaymentType('card'); setShowCreditWarning(false); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'card'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💳 بطاقة بنكية
            </button>
            <button
              onClick={() => setPaymentType('credit')}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'credit'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 آجل
            </button>
            <button
              onClick={() => { setPaymentType('installment'); setShowInstallmentModal(true); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'installment'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 تقسيط
            </button>
          </div>
          {/* Credit Warning */}
          {showCreditWarning && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700 text-center">
              ⚠️ يجب اختيار عميل للبيع الآجل
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || checkoutLoading}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Printer size={20} />
            )}
            {checkoutLoading ? 'جاري المعالجة...' : 'إتمام البيع وطباعة'}
          </button>
          <button
            onClick={onClearCart}
            disabled={cartItems.length === 0}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={16} />
            إلغاء السلة
          </button>
        </div>
      </div>

      {/* Installment Modal */}
      {showInstallmentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-purple-600 p-5 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">📅 بيانات التقسيط</h2>
              <button onClick={() => { setShowInstallmentModal(false); setPaymentType('cash'); }}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-sm text-gray-600">إجمالي الفاتورة</div>
                <div className="text-2xl font-bold text-purple-700">{formatCurrency(total)}</div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">المقدم (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-center text-lg focus:border-purple-400 focus:outline-none"
                  value={installmentData.down_payment}
                  onChange={(e) => setInstallmentData({...installmentData, down_payment: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">عدد الأشهر</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 9, 12].map(m => (
                    <button
                      key={m}
                      onClick={() => setInstallmentData({...installmentData, months_count: String(m)})}
                      className={`py-2 rounded-xl font-bold text-sm transition-colors ${
                        installmentData.months_count === String(m)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {m} شهر
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-xl text-center focus:outline-none focus:border-purple-400"
                  value={installmentData.months_count}
                  onChange={(e) => setInstallmentData({...installmentData, months_count: e.target.value})}
                  placeholder="أو أدخل عدد مخصص"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ أول قسط</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-bold focus:border-purple-400 focus:outline-none"
                  value={installmentData.due_date}
                  onChange={(e) => setInstallmentData({...installmentData, due_date: e.target.value})}
                />
              </div>

              {installmentData.down_payment !== '' && installmentData.months_count && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <div className="text-sm text-gray-600">القسط الشهري</div>
                  <div className="text-xl font-bold text-green-700">
                    {formatCurrency((total - (parseFloat(installmentData.down_payment) || 0)) / (parseInt(installmentData.months_count) || 1))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    المتبقي بعد المقدم: {formatCurrency(total - (parseFloat(installmentData.down_payment) || 0))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInstallmentModal(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                ✅ تأكيد وإتمام البيع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
