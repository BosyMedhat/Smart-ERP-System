import { Plus, Minus, Printer, Clock, CreditCard, X } from 'lucide-react';
import { CartItem } from '../App';

interface CartProps {
  cartItems: CartItem[];
  selectedCustomer: string;
  onCustomerChange: (customer: string) => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearCart: () => void;
}

const customers = [
  { id: '', name: 'عميل نقدي' },
  { id: '1', name: 'أحمد محمد - شركة النور' },
  { id: '2', name: 'فاطمة علي - مؤسسة الأمل' },
  { id: '3', name: 'محمود حسن - متجر السلام' },
];

export function Cart({
  cartItems,
  selectedCustomer,
  onCustomerChange,
  discount,
  onDiscountChange,
  onUpdateQuantity,
  onClearCart,
}: CartProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.14;
  const total = subtotal + tax - discount;

  return (
    <div className="h-full bg-white rounded-xl shadow-sm flex flex-col">
      {/* Customer Selection */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          اختيار العميل
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => onCustomerChange(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
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

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={cartItems.length === 0}
          >
            <Printer size={20} />
            إتمام البيع وطباعة
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
