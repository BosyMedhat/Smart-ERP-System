import { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Printer, X, Loader2, ScanLine, User, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartItem, Product } from '../App';
import apiClient from '../../api/axiosConfig';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { formatCurrency } from '../utils/currency';
import { notify } from '@/lib/notifications';
import { useConfirm } from './ConfirmDialog';
import CustomerInfoModal, { CustomerData } from './CustomerInfoModal';

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
  const { t } = useTranslation();
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
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [pricingConfig, setPricingConfig] = useState({
    installment_markup_pct: '0',
    credit_markup_pct: '0',
    tax_rate: '14',
  });

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

      // Check stock availability before adding to cart
      if (!mappedProduct.current_stock || mappedProduct.current_stock <= 0) {
        notify.error(`المنتج "${mappedProduct.name}" غير متوفر في المخزون`);
        return;
      }

      onAddToCart(mappedProduct);
      setLastScannedProduct(product.name);
      
      // Clear the success message after 3 seconds
      setTimeout(() => setLastScannedProduct(null), 3000);
    } catch (err) {
      console.error('Barcode scan error:', err);
      notify.error('باركود غير موجود', { description: `الباركود: ${barcode}` });
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

  // Fetch dynamic pricing config (markup percentages by payment type)
  useEffect(() => {
    apiClient.get('/pricing-config/')
      .then(res => setPricingConfig(res.data))
      .catch(() => {}); // silent fail — use defaults
  }, []);

  // Effective price = base price + markup based on selected payment type
  const getEffectivePrice = (basePrice: number): number => {
    let markupPct = 0;
    if (paymentType === 'installment') {
      markupPct = parseFloat(pricingConfig.installment_markup_pct) || 0;
    } else if (paymentType === 'credit') {
      markupPct = parseFloat(pricingConfig.credit_markup_pct) || 0;
    }
    if (markupPct === 0) return basePrice;
    return basePrice * (1 + markupPct / 100);
  };

  // Base subtotal (sent to backend; backend re-applies markup server-side)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Display subtotal/total reflect the markup the customer actually pays
  const displaySubtotal = cartItems.reduce(
    (sum, item) => sum + getEffectivePrice(item.price) * item.quantity,
    0
  );
  const tax = displaySubtotal * 0.14;
  const total = displaySubtotal + tax - discount;
  const finalAmount = total > 0 ? total : 0;

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      notify.warning('السلة فارغة!', { description: 'أضف منتجات للسلة قبل إتمام البيع' });
      return;
    }

    // Check if credit is selected without a customer
    if (paymentType === 'credit' && !selectedCustomer) {
      setShowCreditWarning(true);
      return;
    }
    setShowCreditWarning(false);

    // For cash payment types: open customer info modal
    const cashPaymentTypes = ['cash', 'vodafone_cash', 'instapay', 'card'];
    if (cashPaymentTypes.includes(paymentType)) {
      setShowCustomerModal(true);
      return;
    }

    try {
      // Validate installment
      if (paymentType === 'installment') {
        if (!selectedCustomer) {
          setShowCreditWarning(true);
          return;
        }
        if (!installmentData.down_payment && installmentData.down_payment !== '0') {
          notify.warning('برجاء إدخال المقدم', { description: 'يمكن أن يكون صفر' });
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
      notify.success('تم البيع بنجاح!', {
        description: `رقم الفاتورة: ${res.data.invoice_number} | الإجمالي: ${res.data.final_amount} ج.م | طريقة الدفع: ${paymentMethodNames[paymentType]}`,
      });
      onClearCart();
      if (onSaleComplete) onSaleComplete();
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      if (axiosErr.response?.status === 400) {
        const errMsg = axiosErr.response?.data
          ? JSON.stringify(axiosErr.response.data, null, 2)
          : 'Error in data';
        notify.error('خطأ في البيانات', { description: errMsg });
      } else {
        notify.error('فشل إتمام البيع', { description: 'يرجى المحاولة مرة أخرى' });
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCustomerConfirm = async (data: CustomerData) => {
    setShowCustomerModal(false);
    setCheckoutLoading(true);
    try {
      const payload: Record<string, unknown> = {
        customer: null,
        total_amount: subtotal,
        discount: discount,
        payment_type: paymentType,
        items: cartItems.map(item => ({
          product: parseInt(item.id),
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        walk_in_name: data.name,
        walk_in_phone: data.phone,
      };
      const res = await apiClient.post('/sales/', payload);
      const paymentMethodNames: Record<string, string> = {
        cash: 'كاش',
        vodafone_cash: 'فودافون كاش',
        instapay: 'انستاباي',
        card: 'بطاقة بنكية',
      };
      notify.success('تم البيع بنجاح!', {
        description: `رقم الفاتورة: ${res.data.invoice_number} | الإجمالي: ${res.data.final_amount} ج.م | طريقة الدفع: ${paymentMethodNames[paymentType] ?? paymentType}`,
      });
      onClearCart();
      if (onSaleComplete) onSaleComplete();
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      if (axiosErr.response?.status === 400) {
        const errMsg = axiosErr.response?.data
          ? JSON.stringify(axiosErr.response.data, null, 2)
          : 'Error in data';
        notify.error('خطأ في البيانات', { description: errMsg });
      } else {
        notify.error('فشل إتمام البيع', { description: 'يرجى المحاولة مرة أخرى' });
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
              <div>{t('pos.cartEmpty')}</div>
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
                    <div className="text-[#3B82F6] font-bold text-xs">{formatCurrency(getEffectivePrice(item.price))}</div>
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
                    {formatCurrency(getEffectivePrice(item.price) * item.quantity)}
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
          {paymentType === 'installment' &&
           parseFloat(pricingConfig.installment_markup_pct) > 0 && (
            <div className="text-xs text-orange-500 text-right mt-1">
              * يشمل زيادة التقسيط {pricingConfig.installment_markup_pct}%
            </div>
          )}
          {paymentType === 'credit' &&
           parseFloat(pricingConfig.credit_markup_pct) > 0 && (
            <div className="text-xs text-orange-500 text-right mt-1">
              * يشمل زيادة الآجل {pricingConfig.credit_markup_pct}%
            </div>
          )}
        </div>

        {/* Payment Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('pos.paymentMethod')}
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
              💵 {t('pos.cash')}
            </button>
            <button
              onClick={() => { setPaymentType('vodafone_cash'); setShowCreditWarning(false); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'vodafone_cash'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📱 {t('pos.vodafone')}
            </button>
            <button
              onClick={() => { setPaymentType('instapay'); setShowCreditWarning(false); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'instapay'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📲 {t('pos.instapay')}
            </button>
            <button
              onClick={() => { setPaymentType('card'); setShowCreditWarning(false); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'card'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💳 {t('pos.card')}
            </button>
            <button
              onClick={() => setPaymentType('credit')}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'credit'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 {t('pos.credit')}
            </button>
            <button
              onClick={() => { setPaymentType('installment'); setShowInstallmentModal(true); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                paymentType === 'installment'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 {t('pos.installment')}
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

      <CustomerInfoModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onConfirm={handleCustomerConfirm}
        paymentType={paymentType}
        totalAmount={total}
      />

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
