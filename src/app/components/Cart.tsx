import { useState, useEffect } from 'react';
import { Plus, Minus, Printer, Clock, CreditCard, X, Loader2 } from 'lucide-react';
import { CartItem } from '../App';
import apiClient from '../../api/axiosConfig';

interface CartProps {
  cartItems: CartItem[];
  selectedCustomer: string;
  onCustomerChange: (customer: string) => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearCart: () => void;
  onSaleComplete?: () => void;
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
}: CartProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');

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

    setCheckoutLoading(true);
    try {
      const res = await apiClient.post('/sales/', {
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
      });
      alert(`✅ تم البيع!\nرقم الفاتورة: ${res.data.invoice_number}\nالإجمالي: ${res.data.final_amount} ج.م`);
      onClearCart();
      if (onSaleComplete) onSaleComplete();
    } catch (err: any) {
      console.error('Checkout error:', err);
      if (err.response?.status === 400) {
        const errors = err.response?.data;
        const errorMsg = errors ? JSON.stringify(errors, null, 2) : 'خطأ في البيانات';
        alert('❌ خطأ في البيانات:\n' + errorMsg);
      } else {
        alert('❌ فشل في إتمام البيع، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="h-full bg-white rounded-xl shadow-sm flex flex-col">
      {/* Customer Selection */}
      <div className="p-4 border-b border-gray-200">
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
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
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
                className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate">
                      {item.name}
                    </div>
                    <div className="text-[#3B82F6] font-bold text-sm">
                      {item.price.toFixed(2)} ج.م
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-bold text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="font-bold text-gray-800">
                    {(item.price * item.quantity).toFixed(2)} ج.م
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">الإجمالي الفرعي</span>
            <span className="font-semibold text-gray-800">{subtotal.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">الضريبة (14%)</span>
            <span className="font-semibold text-gray-800">{tax.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-600">الخصم</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-left focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="border-t border-gray-300 pt-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">الصافي النهائي</span>
            <span className="text-2xl font-bold text-[#10B981]">
              {total.toFixed(2)} ج.م
            </span>
          </div>
        </div>

        {/* Payment Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            طريقة الدفع
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentType('cash')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                paymentType === 'cash'
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              كاش
            </button>
            <button
              onClick={() => setPaymentType('credit')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                paymentType === 'credit'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              آجل
            </button>
          </div>
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
          <div className="grid grid-cols-3 gap-2">
            <button
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cartItems.length === 0}
            >
              <Clock size={16} />
              تعليق
            </button>
            <button
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cartItems.length === 0}
            >
              <CreditCard size={16} />
              آجل
            </button>
            <button
              onClick={onClearCart}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cartItems.length === 0}
            >
              <X size={16} />
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
