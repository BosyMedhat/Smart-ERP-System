import { useState } from 'react';
import { X, Plus, Trash2, DollarSign } from 'lucide-react';

interface CashItem {
  id: number;
  description: string;
  quantity: number;
  amount: number;
}

interface CashPermissionModalProps {
  onClose: () => void;
}

export function CashPermissionModal({ onClose }: CashPermissionModalProps) {
  const [items, setItems] = useState<CashItem[]>([
    { id: 1, description: 'صرف مكتب', quantity: 1, amount: 500 },
    { id: 2, description: 'مستلزمات مكتبية', quantity: 2, amount: 200 },
  ]);

  const addItem = () => {
    const newId = Date.now();
    setItems([...items, { id: newId, description: '', quantity: 1, amount: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: number,
    field: keyof CashItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'description' ? value : Number(value),
            }
          : item
      )
    );
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <DollarSign className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">إذن صرف نقدية</h2>
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
                <div className="flex-1 flex items-center gap-4">
                  <input
                    type="text"
                    value={item.description}
                    placeholder="اكتب وصف المصروف"
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    className="w-20 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    min={0}
                    onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                    className="w-24 px-3 py-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <span className="w-24 text-right font-bold text-gray-700">
                    {(item.quantity * item.amount).toLocaleString()} ج.م
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
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-3 rounded-xl hover:bg-yellow-600 transition"
          >
            <Plus />
            إضافة بند صرف
          </button>

          {/* Total */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl text-xl font-bold">
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
            حفظ وطباعة الإذن
          </button>
        </div>
      </div>
    </div>
  );
}
