import { useState } from 'react';
import { X, ShoppingCart, Plus, Trash2, DollarSign } from 'lucide-react';

interface Item {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface SalesInvoiceModalProps {
  onClose: () => void;
}

export function SalesInvoiceModal({ onClose }: SalesInvoiceModalProps) {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'صنف A', quantity: 2, price: 1250 },
    { id: 2, name: 'صنف B', quantity: 1, price: 850 },
  ]);

  const addItem = () => {
    const newItem: Item = {
      id: Date.now(),
      name: 'صنف جديد',
      quantity: 1,
      price: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof Item, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: field === 'name' ? value : Number(value) } : item
      )
    );
  };

  const total = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">فاتورة بيع</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-sm transition"
              >
                {/* Item Info */}
                <div className="flex-1 flex items-center gap-4">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    className="w-20 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                    className="w-24 px-3 py-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <span className="w-24 text-right font-bold text-gray-700">
                    {(item.quantity * item.price).toLocaleString()} ج.م
                  </span>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 transition"
                >
                  <Trash2 className="text-red-600" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
          >
            <Plus />
            إضافة صنف
          </button>

          {/* Total */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-xl text-xl font-bold">
            <span>الإجمالي الكلي:</span>
            <span>
              <DollarSign className="inline-block mr-1" />
              {total.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            إلغاء
          </button>
          <button className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
            حفظ وطباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
}
